import { getProfiles } from '@/helpers/profile';
import { getInstance } from '@snapshot-labs/lock/plugins/vue3';
import { ipfsGet, getScores } from '@snapshot-labs/snapshot.js/src/utils';
import {
  getBlockNumber,
  signMessage
} from '@snapshot-labs/snapshot.js/src/utils/web3';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import gateways from '@snapshot-labs/snapshot.js/src/gateways.json';
import client from '@/helpers/client';
import { formatProposal, formatProposals, formatSpace } from '@/helpers/utils';
import { version } from '@/../package.json';
import i18n from '@/i18n';

const gateway = process.env.VUE_APP_IPFS_GATEWAY || gateways[0];

const state = {
  init: false,
  loading: false,
  authLoading: false,
  modalOpen: false,
  spaces: {}
};

const mutations = {
  SET(_state, payload) {
    Object.keys(payload).forEach(key => {
      _state[key] = payload[key];
    });
  },
  SEND_REQUEST() {
    console.debug('SEND_REQUEST');
  },
  SEND_SUCCESS() {
    console.debug('SEND_SUCCESS');
  },
  SEND_FAILURE(_state, payload) {
    console.debug('SEND_FAILURE', payload);
  },
  GET_PROPOSALS_REQUEST() {
    console.debug('GET_PROPOSALS_REQUEST');
  },
  GET_PROPOSALS_SUCCESS() {
    console.debug('GET_PROPOSALS_SUCCESS');
  },
  GET_PROPOSALS_FAILURE(_state, payload) {
    console.debug('GET_PROPOSALS_FAILURE', payload);
  },
  GET_PROPOSAL_REQUEST() {
    console.debug('GET_PROPOSAL_REQUEST');
  },
  GET_PROPOSAL_SUCCESS() {
    console.debug('GET_PROPOSAL_SUCCESS');
  },
  GET_PROPOSAL_FAILURE(_state, payload) {
    console.debug('GET_PROPOSAL_FAILURE', payload);
  },
  GET_POWER_REQUEST() {
    console.debug('GET_POWER_REQUEST');
  },
  GET_POWER_SUCCESS() {
    console.debug('GET_POWER_SUCCESS');
  },
  GET_POWER_FAILURE(_state, payload) {
    console.debug('GET_POWER_FAILURE', payload);
  }
};

const isAllocation = (
  payloadChoice: any
): payloadChoice is Record<number, number> => {
  return typeof payloadChoice !== 'number';
};

const didVoteFor = (vote: any, choice: number) => {
  const payloadChoice = vote.msg.payload.choice;
  if (isAllocation(payloadChoice)) {
    return payloadChoice[choice] && payloadChoice[choice] > 0;
  }
  return payloadChoice == choice;
};

interface Spaces {
  [id: string]: Space;
}

interface Space {
  key: string;
  name: string;
  network: string;
  strategies: any[];
  filters: any;
  members: any[];
  skin: string;
  symbol: string;
  domain: string;
}

const augmentSpaces = (spaces: Spaces) => {
  return spaces;
};

const actions = {
  init: async ({ commit, dispatch }) => {
    const auth = getInstance();
    commit('SET', { loading: true });
    await dispatch('getSpaces');
    auth.getConnector().then(connector => {
      if (connector) dispatch('login', connector);
    });
    commit('SET', { loading: false, init: true });
  },
  loading: ({ commit }, payload) => {
    commit('SET', { loading: payload });
  },
  toggleModal: ({ commit }) => {
    commit('SET', { modalOpen: !state.modalOpen });
  },
  getSpaces: async ({ commit }) => {
    let spaces: any = await client.request('spaces');
    spaces = Object.fromEntries(
      Object.entries(spaces).map(space => [
        space[0],
        formatSpace(space[0], space[1])
      ])
    );
    spaces = augmentSpaces(spaces);
    commit('SET', { spaces });
    return spaces;
  },
  send: async ({ commit, dispatch, rootState }, { space, type, payload }) => {
    const auth = getInstance();
    commit('SEND_REQUEST');
    try {
      const msg: any = {
        address: rootState.web3.account,
        msg: JSON.stringify({
          version,
          timestamp: (Date.now() / 1e3).toFixed(),
          space,
          type,
          payload
        })
      };
      msg.sig = await signMessage(auth.web3, msg.msg, rootState.web3.account);
      const result = await client.request('message', msg);
      commit('SEND_SUCCESS');
      dispatch('notify', [
        'green',
        type === 'delete-proposal'
          ? i18n.global.t('notify.proposalDeleted')
          : i18n.global.t('notify.yourIsIn', [type])
      ]);
      return result;
    } catch (e) {
      commit('SEND_FAILURE', e);
      const errorMessage =
        e && e.error_description
          ? `Oops, ${e.error_description}`
          : i18n.global.t('notify.somethingWentWrong');
      dispatch('notify', ['red', errorMessage]);
      return;
    }
  },
  getProposals: async ({ commit }, space) => {
    commit('GET_PROPOSALS_REQUEST');

    try {
      let proposals: any = await client.request(`${space.key}/proposals`);
      console.log('getProposals.proposals: ', proposals);
      console.log('getProposals.space: ', space);

      if (proposals && !space.filters?.onlyMembers) {
        console.log('getProposals.getScores starting...');
        const scores: any = await getScores(
          space.key,
          space.strategies,
          space.network,
          getProvider(space.network),
          Object.values(proposals).map((proposal: any) => proposal.address)
        );
        console.log('Scores', scores);
        proposals = Object.fromEntries(
          Object.entries(proposals).map((proposal: any) => {
            proposal[1].score = scores.reduce(
              (a, b) => a + (b[proposal[1].address] || 0),
              0
            );
            return [proposal[0], proposal[1]];
          })
        );
        console.log('getProposals.withScores: ', proposals);
      }
      commit('GET_PROPOSALS_SUCCESS');
      return formatProposals(proposals);
    } catch (e) {
      console.error(e);
      commit('GET_PROPOSALS_FAILURE', e);
    }
  },
  getProposal: async ({ commit }, { space, id }) => {
    commit('GET_PROPOSAL_REQUEST');
    try {
      const provider = getProvider(space.network);
      console.time('getProposal.data');
      const response = await Promise.all([
        ipfsGet(gateway, id),
        client.request(`${space.key}/proposal/${id}`),
        getBlockNumber(provider)
      ]);
      console.timeEnd('getProposal.data');
      console.log(response);
      const [, , blockNumber] = response;
      let [proposal, votes]: any = response;
      proposal = formatProposal(proposal);
      proposal.ipfsHash = id;
      const voters = Object.keys(votes);
      const { snapshot } = proposal.msg.payload;
      const blockTag = snapshot > blockNumber ? 'latest' : parseInt(snapshot);

      /* Get scores */
      console.log('getProposal.space: ', space);

      console.time('getProposal.scores');
      const [scores, profiles]: any = (
        await Promise.allSettled([
          getScores(
            space.key,
            space.strategies,
            space.network,
            provider,
            voters,
            // @ts-ignore
            blockTag
          ),
          getProfiles([proposal.address, ...voters])
        ])
      ).map(result => {
        if (result.status === 'rejected') {
          console.error(result.reason);
          return {};
        }
        return result.value;
      });

      console.timeEnd('getProposal.scores');
      console.log('Scores', scores);

      const authorProfile = profiles[proposal.address];
      voters.forEach(address => {
        votes[address].profile = profiles[address];
      });
      proposal.profile = authorProfile;

      console.log('Voters:', voters);

      console.log('Votes:', votes);

      votes = Object.fromEntries(
        Object.entries(votes)
          .map((vote: any) => {
            vote[1].scores = space.strategies.map(
              (strategy, i) => scores[i][vote[1].address] || 0
            );
            vote[1].balance = vote[1].scores.reduce((a, b: any) => a + b, 0);

            const payloadChoice = vote[1].msg.payload.choice;
            if (isAllocation(payloadChoice)) {
              const choiceAllocation = Object.values(
                vote[1].msg.payload.choice
              ) as number[];

              vote[1].totalAllocation = choiceAllocation.reduce(
                (acc, allocation) => acc + allocation,
                0
              );

              return vote;
            }

            vote[1].totalAllocation = 1;
            return vote;
          })
          .sort((a, b) => b[1].balance - a[1].balance)
          .filter(vote => vote[1].balance > 0)
      );

      console.log('Votes: ', votes);

      /* Get results */
      const results = {
        totalVotes: proposal.msg.payload.choices.map((_, i) => {
          return Object.values(votes).filter((vote: any) =>
            didVoteFor(vote, i + 1)
          ).length;
        }),
        totalBalances: proposal.msg.payload.choices.map((_, i) =>
          Object.values(votes)
            .filter((vote: any) => didVoteFor(vote, i + 1))
            .reduce((a: any, b: any) => {
              const allocationWeight = isAllocation(b.msg.payload.choice)
                ? b.msg.payload.choice[i + 1]
                : 1;
              const weightedBalance =
                (b.balance * allocationWeight) / b.totalAllocation;
              return a + weightedBalance;
            }, 0)
        ),
        totalScores: proposal.msg.payload.choices.map((choice, i) =>
          space.strategies.map((strategy, sI) =>
            Object.values(votes)
              .filter((vote: any) => didVoteFor(vote, i + 1))
              .reduce((a: any, b: any) => {
                const allocationWeight = isAllocation(b.msg.payload.choice)
                  ? b.msg.payload.choice[i + 1]
                  : 1;
                const weightedScore =
                  (b.scores[sI] * allocationWeight) / b.totalAllocation;
                return a + weightedScore;
              }, 0)
          )
        ),
        totalVotesBalances: Object.values(votes).reduce(
          (a, b: any) => a + b.balance,
          0
        )
      };

      console.log('Results: ', results);

      commit('GET_PROPOSAL_SUCCESS');
      return { proposal, votes, results };
    } catch (e) {
      console.error(e);
      commit('GET_PROPOSAL_FAILURE', e);
    }
  },
  getPower: async ({ commit }, { space, address, snapshot }) => {
    commit('GET_POWER_REQUEST');
    try {
      const blockNumber = await getBlockNumber(getProvider(space.network));
      const blockTag = snapshot > blockNumber ? 'latest' : parseInt(snapshot);
      let scores: any = await getScores(
        space.key,
        space.strategies,
        space.network,
        getProvider(space.network),
        [address],
        // @ts-ignore
        blockTag
      );
      scores = scores.map((score: any) =>
        Object.values(score).reduce((a, b: any) => a + b, 0)
      );
      commit('GET_POWER_SUCCESS');
      return {
        scores,
        totalScore: scores.reduce((a, b: any) => a + b, 0)
      };
    } catch (e) {
      console.error(e);
      commit('GET_POWER_FAILURE', e);
    }
  }
};

export default {
  state,
  mutations,
  actions
};

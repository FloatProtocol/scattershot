import {
  batchSubgraphRequest,
  subgraphRequest
} from '@snapshot-labs/snapshot.js/src/utils';

function get3BoxProfiles(addresses) {
  return new Promise((resolove, reject) => {
    subgraphRequest('https://api.3box.io/graph', {
      profiles: {
        __args: {
          ids: addresses
        },
        name: true,
        eth_address: true,
        image: true
      }
    })
      .then(({ profiles }) => {
        const _3BoxProfiles = {};
        profiles.forEach(profile => {
          _3BoxProfiles[profile.eth_address.toLowerCase()] = profile;
        });
        resolove(_3BoxProfiles);
      })
      .catch(error => {
        reject(error);
      });
  });
}

function lookupAddresses(addresses) {
  const ensSubgraphUrl =
    'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
  const batchSize = 1000;

  const paramsGenerator = userIds => ({
    accounts: {
      __args: {
        first: batchSize,
        where: {
          id_in: userIds.map(address => address.toLowerCase())
        }
      },
      id: true,
      registrations: {
        __args: {
          orderBy: 'registrationDate',
          first: 1
        },
        domain: {
          name: true,
          labelName: true
        }
      }
    }
  });
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }
  const ensSubgraphResponse = batchSubgraphRequest<string[]>(
    ensSubgraphUrl,
    paramsGenerator,
    batches
  );

  const isolated = ensSubgraphResponse.then(response => {
    return response?.accounts?.reduce((ensNames, profile) => {
      ensNames[profile.id.toLowerCase()] =
        (profile?.registrations?.[0]?.domain?.labelName &&
          profile?.registrations?.[0]?.domain?.name) ||
        '';
      return ensNames;
    }, {});
  });

  return isolated;
}

export async function getProfiles(addresses) {
  let ensNames: any = {};
  let _3BoxProfiles: any = {};
  try {
    [ensNames, _3BoxProfiles] = await Promise.all([
      lookupAddresses(addresses),
      get3BoxProfiles(addresses)
    ]);
  } catch (e) {
    console.log(e);
  }

  const profiles = Object.fromEntries(addresses.map(address => [address, {}]));
  return Object.fromEntries(
    Object.entries(profiles).map(([address, profile]) => {
      profile = _3BoxProfiles[address.toLowerCase()] || {};
      profile.ens = ensNames[address.toLowerCase()] || '';
      return [address, profile];
    })
  );
}

import {
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1
} from "@metaplex-foundation/mpl-token-metadata";
import {
    keypairIdentity,
    publicKey
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    airdropIfRequired,
    getExplorerLink,
    getKeypairFromFile
} from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
  
  const connection = new Connection(clusterApiUrl("devnet"));
  
  const user = await getKeypairFromFile();
  
  await airdropIfRequired(
    connection,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL
  );
  
  console.log(user, "user");
  console.log(connection, "connection");
  
  const umi = createUmi(connection.rpcEndpoint);
  umi.use(mplTokenMetadata());
  
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));
  
  console.log("Set up Umi instance for user");

  const collectionAddress = publicKey('4WNs33R39LknmsPMUFQXyQcVNDvRXNpwhzvGZPJE8U7h')

  const nftAddress = publicKey('4zd9esYcgAzAh49Gt836U3Bfak8pbAbLAuLAhKrMErtw')

  const nftMetadata = findMetadataPda(umi, {mint: nftAddress})

  const transaction = await verifyCollectionV1(umi, {metadata: nftMetadata, collectionMint: collectionAddress, authority: umi.identity})

transaction.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' }
  })

  console.log(`NFT ${nftAddress} verified as member of collection ${collectionAddress}! See explorer at: ${getExplorerLink('address', nftAddress, "devnet")}`)


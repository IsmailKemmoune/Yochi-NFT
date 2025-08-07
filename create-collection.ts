import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  UmiError,
} from "@metaplex-foundation/umi";

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

const collectionMint = generateSigner(umi);

console.log(collectionMint, "collectionMint");

try {
  const transaction = await createNft(umi, {
    mint: collectionMint,
    name: "Yochi",
    symbol: "YCH",
    uri: "https://coral-hollow-tahr-556.mypinata.cloud/ipfs/bafkreigfbtk4ai7tur2evedh6h4gifqexe7qkv622ulref76vtsqng74om",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  });

  const tx = await transaction.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' }
  });

  console.log("Transaction confirmed:", tx);

  // Wait a bit for the transaction to be fully processed
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Try to fetch the digital asset with retry logic
  let createdCollectionNft;
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      createdCollectionNft = await fetchDigitalAsset(umi, collectionMint.publicKey);
      break;
    } catch (error) {
      retries++;
      console.log(`Attempt ${retries} to fetch digital asset failed:`, error.message);
      
      if (retries >= maxRetries) {
        console.error("Failed to fetch digital asset after all retries");
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }

  console.log(`Collection NFT created: ${getExplorerLink('address', createdCollectionNft.mint.publicKey, "devnet")}`);
  console.log("Collection NFT details:", createdCollectionNft);

} catch (error) {
  console.error("Error creating collection NFT:", error);
  
  if (error instanceof UmiError) {
    console.error("Umi Error details:", error.message);
  }
  
  throw error;
}

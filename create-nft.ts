import {
    createNft,
    fetchDigitalAsset,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey,
    UmiError,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    airdropIfRequired,
    getExplorerLink,
    getKeypairFromFile,
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

  console.log('Creating NFT...')

  const mint = generateSigner(umi)

  try {
    const transaction = await createNft(umi, {
      mint,
      name: "Yochi",
      symbol: "YCH",
      uri: "https://coral-hollow-tahr-556.mypinata.cloud/ipfs/bafkreigfbtk4ai7tur2evedh6h4gifqexe7qkv622ulref76vtsqng74om",
      sellerFeeBasisPoints: percentAmount(0),
      collection: {
          key: collectionAddress,
          verified: false,
      }
    });

    const tx = await transaction.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' }
    });

    console.log("Transaction confirmed:", tx);

    // Wait a bit for the transaction to be fully processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to fetch the digital asset with retry logic
    let createdNft;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        createdNft = await fetchDigitalAsset(umi, mint.publicKey);
        break;
      } catch (error) {
        retries++;
        console.log(`Attempt ${retries} to fetch digital asset failed:`, error instanceof Error ? error.message : String(error));
        
        if (retries >= maxRetries) {
          console.error("Failed to fetch digital asset after all retries");
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    if (createdNft) {
      console.log(`NFT created: ${getExplorerLink('address', createdNft.mint.publicKey, "devnet")}`);
      console.log("NFT details:", createdNft);
    } else {
      console.error("Failed to fetch digital asset after all retries");
    }

  } catch (error) {
    console.error("Error creating NFT:", error);
    
    if (error instanceof UmiError) {
      console.error("Umi Error details:", error.message);
    } else if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    
    throw error;
  }

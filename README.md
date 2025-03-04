This is a [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh) + [Next.js](https://nextjs.org/) project bootstrapped with [`create-rainbowkit`](/packages/create-rainbowkit).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3456](http://localhost:3456) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

### Custom Port Configuration

By default, the application runs on port 3456. You can change this in several ways:

1. **Using environment variables**: Set the `PORT` variable in your `.env.local` file:
   ```
   PORT=4000
   ```

2. **Using custom npm scripts**:
   ```bash
   # Run on the default port (3456)
   npm run dev
   
   # Run on the standard Next.js port (3000)
   npm run dev:default
   
   # Run on a custom port
   npm run dev:custom 5000
   ```

3. **Directly in package.json**: Edit the port number in the `dev` and `start` scripts.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_ENABLE_TESTNETS=true

NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_GATEWAY_URL=your_gateway_url

# Server configuration
PORT=3456
```

## IPFS Functionality

This application includes functionality to upload and download files to/from IPFS using Pinata:

### Features

1. **Upload to IPFS**: Users can upload JSON files to IPFS directly from the Register New Agent dialog.
2. **Download from IPFS**: The application can retrieve files from IPFS and display their contents.
3. **Character Template**: A template JSON file is provided for users to understand the expected format.
4. **Local Caching**: Downloaded IPFS files are cached locally to improve performance.

### API Endpoints

- `POST /api/ipfs/upload`: Upload a file to IPFS
- `GET /api/ipfs/download?cid=<CID>`: Download a file from IPFS by its CID

### Utility Functions

- `ipfsUriToGatewayUrl`: Converts an IPFS URI to a gateway URL
- `extractCidFromIpfsUri`: Extracts the CID from an IPFS URI
- `fetchFromIpfs`: Fetches content from IPFS

## Learn More

To learn more about this stack, take a look at the following resources:

- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Next.js Documentation](https://nextjs.org/docs) - Learn how to build a Next.js application.
- [Pinata Documentation](https://docs.pinata.cloud/) - Learn how to use Pinata for IPFS storage.

You can check out [the RainbowKit GitHub repository](https://github.com/rainbow-me/rainbowkit) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

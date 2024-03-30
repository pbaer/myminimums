import { BlobServiceClient, ContainerClient, BlobClient } from '@azure/storage-blob';

class BlobStorage {
    private containerClient: ContainerClient;

    constructor(connectionString: string, containerName: string) {
        const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = serviceClient.getContainerClient(containerName);
    }

    async listBlobs(): Promise<string[]> {
        let blobNames: string[] = [];
        for await (const blob of this.containerClient.listBlobsFlat()) {
            blobNames.push(blob.name);
        }
        return blobNames;
    }

    async readBlob(key: string): Promise<string> {
        const blobClient = this.containerClient.getBlobClient(key);
        const downloadBlockBlobResponse = await blobClient.download();
        if (!downloadBlockBlobResponse.readableStreamBody) {
            throw new Error('No blob stream found');
        }
        const content = await this.streamToString(downloadBlockBlobResponse.readableStreamBody);
        return content;
    }

    async writeBlob(key: string, value: string): Promise<void> {
        const blobClient = this.containerClient.getBlockBlobClient(key);
        await blobClient.upload(value, value.length);
    }

    async deleteBlob(key: string): Promise<void> {
        const blobClient = this.containerClient.getBlobClient(key);
        await blobClient.delete();
    }

    private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: string[] = [];
            readableStream.on('data', (data) => {
                chunks.push(data.toString());
            });
            readableStream.on('end', () => {
                resolve(chunks.join(''));
            });
            readableStream.on('error', reject);
        });
    }
}

export default BlobStorage;

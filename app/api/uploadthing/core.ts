import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getSession } from '@/lib/auth';

const f = createUploadthing();

export const ourFileRouter = {
  venueImageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 8,
    },
  })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error('Unauthorized');
      return { userId: session.userId, role: session.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('Uploaded image url:', file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

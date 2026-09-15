import prisma from '../prisma';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'BOOKING' | 'APPROVAL' | 'PAYMENT' | 'SYSTEM';
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'SYSTEM',
        link: params.link || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

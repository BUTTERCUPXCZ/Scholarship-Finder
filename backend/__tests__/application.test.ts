import { submitApplication, getUserApplications, getApplicationById, withdrawApplication, updateApplicationStatus } from '../src/controllers/application.controller';
import { prisma } from '../src/lib/db';
import { createNotification } from '../src/services/notification';
import { Request, Response } from 'express';

// Mock prisma and createNotification
jest.mock('../src/lib/db', () => ({
    prisma: {
        application: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        scholarship: {
            findFirst: jest.fn(),
        },
    },
}));

jest.mock('../src/services/notification', () => ({
    createNotification: jest.fn(),
}));

// Helper to mock Express req/res
const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Application Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('submitApplication', () => {
        it('should return 401 if userId is missing', async () => {
            const req = { body: {}, userId: undefined } as unknown as Request;
            const res = mockResponse();

            await submitApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });

        it('should prevent duplicate applications', async () => {
            (prisma.application.findFirst as jest.Mock).mockResolvedValue({ id: '123' });

            const req = {
                userId: 'user1',
                body: {
                    scholarshipId: 'sch1',
                    Firstname: 'John',
                    Lastname: 'Doe',
                    Email: 'john@example.com',
                    Phone: '1234567890',
                    Address: '123 St',
                    City: 'Townsville',
                },
            } as unknown as Request;
            const res = mockResponse();

            await submitApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'You have already applied for this scholarship' });
        });

        it('should create a new application successfully', async () => {
            (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.application.create as jest.Mock).mockResolvedValue({ id: 'app1', scholarshipId: 'sch1' });

            const req = {
                userId: 'user1',
                body: {
                    scholarshipId: 'sch1',
                    Firstname: 'John',
                    Lastname: 'Doe',
                    Email: 'john@example.com',
                    Phone: '1234567890',
                    Address: '123 St',
                    City: 'Townsville',
                },
            } as unknown as Request;
            const res = mockResponse();

            await submitApplication(req, res);

            expect(prisma.application.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getUserApplications', () => {
        it('should return applications for user', async () => {
            (prisma.application.findMany as jest.Mock).mockResolvedValue([{ id: 'app1' }]);

            const req = { userId: 'user1' } as unknown as Request;
            const res = mockResponse();

            await getUserApplications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 'app1' }] }));
        });
    });

    describe('getApplicationById', () => {
        it('should return 404 if not found', async () => {
            (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

            const req = { userId: 'user1', params: { id: 'app123' } } as unknown as Request;
            const res = mockResponse();

            await getApplicationById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found' });
        });
    });

    describe('withdrawApplication', () => {
        it('should withdraw successfully', async () => {
            (prisma.application.findFirst as jest.Mock).mockResolvedValue({ id: 'app1', status: 'SUBMITTED' });
            (prisma.application.delete as jest.Mock).mockResolvedValue({ id: 'app1' });

            const req = { userId: 'user1', params: { id: 'app1' } } as unknown as Request;
            const res = mockResponse();

            await withdrawApplication(req, res);

            expect(prisma.application.delete).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application withdrawn successfully' }));
        });
    });

    describe('updateApplicationStatus', () => {
        it('should update status and send notification', async () => {
            (prisma.application.findUnique as jest.Mock).mockResolvedValue({
                id: 'app1',
                scholarship: { providerId: 'org1', title: 'Scholarship A' },
                userId: 'user123',
                user: { id: 'user123', fullname: 'John Doe', email: 'john@example.com' },
            });

            (prisma.application.update as jest.Mock).mockResolvedValue({ id: 'app1', status: 'ACCEPTED' });

            const req = { userId: 'org1', params: { id: 'app1' }, body: { status: 'ACCEPTED' } } as unknown as Request;
            const res = mockResponse();

            await updateApplicationStatus(req, res);

            expect(prisma.application.update).toHaveBeenCalled();
            expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user123',
                type: 'SCHOLARSHIP_ACCEPTED',
            }));
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});

import request from "supertest";
import express from "express";
import * as notificationService from "../src/services/notification";
import {
    fetchNotifications,
    readNotification,
    readAllNotifications,
    removeNotification,
} from "../src/controllers/notification.controller";

const app = express();
app.use(express.json());

// Fake auth middleware to inject userId
app.use((req: any, res, next) => {
    req.userId = "test-user";
    next();
});

// Routes (connect controller functions to routes for testing)
app.get("/notifications", fetchNotifications);
app.put("/notifications/:id/read", readNotification);
app.put("/notifications/read-all", readAllNotifications);
app.delete("/notifications/:id", removeNotification);

jest.mock("../src/services/notification");

describe("Notification Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch notifications", async () => {
        (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
            notifications: [{ id: "1", message: "Hello" }],
            pagination: { page: 1, limit: 20, total: 1 },
        });

        const res = await request(app).get("/notifications?page=1&limit=10");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
            "test-user",
            { page: 1, limit: 10, onlyUnread: false }
        );
    });

    it("should mark a notification as read", async () => {
        (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(
            {}
        );

        const res = await request(app).put("/notifications/123/read");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Notification marked as read");
        expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(
            "123",
            "test-user"
        );
    });

    it("should mark all notifications as read", async () => {
        (notificationService.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(
            {}
        );

        const res = await request(app).put("/notifications/read-all");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("All notifications marked as read");
        expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledWith(
            "test-user"
        );
    });

    it("should delete a notification", async () => {
        (notificationService.deleteNotification as jest.Mock).mockResolvedValue({});

        const res = await request(app).delete("/notifications/456");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Notification deleted successfully");
        expect(notificationService.deleteNotification).toHaveBeenCalledWith(
            "456",
            "test-user"
        );
    });

    it("should return 500 on service error", async () => {
        (notificationService.getUserNotifications as jest.Mock).mockRejectedValue(
            new Error("DB down")
        );

        const res = await request(app).get("/notifications");

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Internal server error");
    });
});

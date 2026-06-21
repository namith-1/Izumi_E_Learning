const nodemailer = require("nodemailer");

// --- SMTP Configuration ---
// Ideally these should be in your .env file
const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'gmail', 'outlook', or use host/port
    auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASS || "your-email-password",
    },
});

/**
 * Send email to instructor when their application is approved
 */
exports.sendInstructorAcceptedEmail = async (email, name) => {
    const mailOptions = {
        from: `"Izumi Academy" <${process.env.EMAIL_USER || "no-reply@izumi.com"}>`,
        to: email,
        subject: "Welcome to Izumi Academy - Instructor Account Approved!",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Congratulations, ${name}!</h2>
                <p>We are excited to inform you that your instructor application has been <strong>approved</strong>.</p>
                <p>You can now log in to your dashboard and start creating amazing courses for our students.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login" 
                       style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       Login to Dashboard
                    </a>
                </div>
                <p>Welcome aboard!</p>
                <p>Best regards,<br/>The Izumi Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to ${email}`);
    } catch (error) {
        console.error("Error sending instructor approval email:", error);
    }
};

/**
 * Send email to instructor when their course status changes
 */
exports.sendCourseStatusEmail = async (email, courseTitle, status, note, isUpdate = false) => {
    const statusColors = {
        approved: "#10b981",
        rejected: "#ef4444",
        "revision-requested": "#f59e0b",
        awaited: "#6366f1"
    };

    const subjects = {
        approved: isUpdate
            ? `✅ Course Update Accepted: "${courseTitle}"`
            : `🎉 Course Approved & Live: "${courseTitle}"`,
        rejected: `❌ Course Not Approved: "${courseTitle}"`,
        "revision-requested": `✏️ Revision Requested: "${courseTitle}"`,
    };

    const headlines = {
        approved: isUpdate
            ? `Your updated course <strong>"${courseTitle}"</strong> has been reviewed and accepted. It is now live!`
            : `Congratulations! Your course <strong>"${courseTitle}"</strong> has been approved and is now live on Izumi Academy.`,
        rejected: `We're sorry — your course <strong>"${courseTitle}"</strong> was not approved at this time.`,
        "revision-requested": `Your course <strong>"${courseTitle}"</strong> requires some revisions before it can be published.`,
    };

    const mailOptions = {
        from: `"Izumi Academy" <${process.env.EMAIL_USER || "no-reply@izumi.com"}>`,
        to: email,
        subject: subjects[status] || `Course Update: ${courseTitle}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1f2937;">Course Status Update</h2>
                <p>${headlines[status] || `Status updated to <strong>${status}</strong>.`}</p>
                <div style="display: inline-block; padding: 6px 16px; background-color: ${statusColors[status] || "#6b7280"}; color: white; border-radius: 20px; font-weight: bold; margin-bottom: 20px; font-size: 0.9rem;">
                    ${status === "approved" ? (isUpdate ? "Update Accepted" : "Approved & Live") : status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                </div>
                ${note ? `<div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #d1d5db; margin: 20px 0;">
                    <p style="margin-top: 0; font-weight: bold;">Reviewer Note:</p>
                    <p style="margin-bottom: 0;">${note}</p>
                </div>` : ""}
                <p>You can view more details in your instructor dashboard.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/instructor-dashboard" 
                       style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       View Dashboard
                    </a>
                </div>
                <p>Best regards,<br/>The Izumi Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Course status email (${status}) sent to ${email}`);
    } catch (error) {
        console.error("Error sending course status email:", error);
    }
};

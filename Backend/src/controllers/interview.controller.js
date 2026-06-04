const pdfParse = require("pdf-parse-fork")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewreport.model")


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        console.log(req.file);
        console.log(req.body);

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required. Please log in."
            });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                message: "File upload failed"
            });
        }

        const resumeContent = await pdfParse(req.file.buffer);
        const { selfDescription, jobDescription } = req.body;

        // Validate that required inputs are not empty strings or just whitespace
        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim() === "") {
            return res.status(400).json({
                message: "Job description is required and cannot be empty."
            });
        }

        if (!resumeContent.text || resumeContent.text.trim() === "") {
            return res.status(400).json({
                message: "Resume content is empty or could not be parsed. Please upload a valid PDF."
            });
        }

        let interViewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        })

        // Ensure the AI response is a parsed object. If it's a string, parse it.
        
        

        // Build final payload and ensure title exists to satisfy Mongoose validation
        const userId = req.user.id || req.user._id;
        const finalReportPayload = {
            user: userId,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        }

        // Fallback for missing title: prefer AI title, then try to derive from jobDescription, else use a safe default
        if (!finalReportPayload.title || typeof finalReportPayload.title !== 'string' || finalReportPayload.title.trim() === '') {
            if (jobDescription && typeof jobDescription === 'string') {
                // Use the first non-empty line or the first 100 chars as a fallback title
                const firstLine = jobDescription.split('\n').find(l => l && l.trim());
                finalReportPayload.title = (firstLine || jobDescription).slice(0, 100).trim();
            } else {
                finalReportPayload.title = 'Untitled Position';
            }
        }
          console.log("FINAL PAYLOAD QUESTIONS:", finalReportPayload.technicalQuestions)
        const interviewReport = await interviewReportModel.create(finalReportPayload)

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport:{
                ...finalReportPayload,
                _id : interviewReport._id
            }
        })

    } catch (error) {
        console.error("ERROR IN GENERATE REPORT CONTROLLER:", error);

        // Handle Mongoose validation errors explicitly so client gets 400 with details
        if (error && error.name === 'ValidationError') {
            const errors = Object.values(error.errors || {}).map(e => e.message);
            return res.status(400).json({ message: 'Validation failed', errors });
        }

        res.status(500).json({
            message: "An internal server error occurred.",
            error: error.message
        });
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params
    const userId = req.user.id || req.user._id;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: userId })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}



/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        // Check both id and _id to ensure compatibility with different auth setups
        const userId = req.user?.id || req.user?._id;
        console.log("REQ USER ID FOR LIST:", userId);

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const interviewReports = await interviewReportModel
            .find({ user: userId })
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            // We keep technicalQuestions/behavioralQuestions in the select so they aren't empty
            .select("-resume -selfDescription -jobDescription -__v"); 

        console.log("FOUND REPORTS COUNT:", interviewReports.length);

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReport 
        });
    } catch (error) {
        console.error("ERROR IN GET ALL REPORTS:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
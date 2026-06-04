const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        You MUST generate a detailed interview report including the following sections:
                        1. Match Score(0-100)
                        2. Technical Questions(Question, Intention, Answer)
                        3. Behavioral Questions(Question, Intention, Answer)
                        4. Skill Gaps(Skill, Severity)
                        5. Preparation Plan(Day, Focus, Tasks)
                        6. Title
 IMPORTANT:
 return ONLY valid json.
 use EXACTLY THESE FIELD NAMES:
 {
 "title": "",
 "matchScore": 0,
 "technicalQuestions": [],
 "behavioralQuestions": [],
 "skillGaps": [],
 "preparationPlan": []
 }
 technicalQuestions format:
 [
 {
 "question": "",
 "intention": "",
 "answer": ""
 }
 ]
 behavioralQuestions format:
 [
 {
 "question": "",
 "intention": "",
 "answer": ""
 }
 ]
 skillGaps format:
 [
 {
 "skill": "",
 "severity": "low"
 }
 ]
 preparationPlan format:
 [
 {
 "day": 1,
 "focus": "",
 "tasks": [""]
 }
 ]
 DO NOT USE:
 Title
 Match Score
 TechnicalQuestions
 BehavioralQuestions
 SkillGaps
 PreparationPlan

 use ONLY:
 title
 matchScore
 technicalQuestions
 behavioralQuestions
 skillGaps
 preparationPlan
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    console.log("Gemini Response")
        console.log(response.text);
    console.log("Resume Length:",resume?.length);
    console.log("job Description:",jobDescription);

    let result
    try{
        result = JSON.parse(response.text)
        console.log("RESULT:", JSON.stringify(result, null, 2));
        console.log("ALL KEYS:", Object.keys(result));

    }catch (error){
        console.error("JSON PARSE ERROR:", error.message)
        result={}
    }
    console.log("ALL KEYS:", Object.keys(result));

    const sanitize=(val)=> Array.isArray(val) ? val : [];
    const mapToQuestions = (q) => typeof q==='string'
    ?{ question: q, intention: '', answer: '' }: q;

    const mapToSkillGaps = (s) => typeof s === 'string'
    ? { skill: s, severity: 'low' }: s;

    const mapToPreparationPlan = (p) => {
        if(typeof p === 'number')return { day: p, focus: '', tasks: [] };
        if(typeof p==='string') return{day: 1, focus: '', tasks: [p] };
        return {
            day: p.day || 1,
            focus: p.focus || '',
            tasks: Array.isArray(p.tasks) ? p.tasks : []
        }
    }

    return {
       title: result['title'] ||'',   
       matchScore: result['matchScore'] || 0,
       technicalQuestions: sanitize(result['technicalQuestions']).map(mapToQuestions),
       behavioralQuestions: sanitize(result['behavioralQuestions']).map(mapToQuestions),
       skillGaps: sanitize(result['skillGaps']).map(mapToSkillGaps),
       preparationPlan: sanitize(result['preparationPlan']).map(mapToPreparationPlan),
   }
}
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1 pagelong when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { agent } from './main';
import { addDocs, initializeRetriever } from './vectorIndex';
import { isRunnableToolLike } from '@langchain/core/utils/function_calling';
import { getAutomationNameFromId } from './utils/helper';

dotenv.config({
  path: './.env',
});

const app = express();

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/ai-wizard', async (req, res) => {
  try {
    // Ensure req.body.query is defined
    if (!req.body.query) {
      res.status(400).json({
        success: false,
        error: 'Query parameter is missing in the request body.',
      });
      return;
    }

    let response = await agent(
      req.body.query,
      req.body.firstName,
      req.body.lastName,
    );
    let name = '';
    let automationDetails = [];
    let otherRecommendedAutomations = [];
    let id = '';
    // @ts-ignore
    if (response?.actionType) {
      // @ts-ignore
      id = response.inputs.automationId;
      otherRecommendedAutomations =
        // @ts-ignore
        response.inputs.otherRecommendedAutomations;

      name = await getAutomationNameFromId(id);

      automationDetails = await Promise.all(
        otherRecommendedAutomations.map((automationId: string) =>
          getAutomationNameFromId(automationId),
        ),
      );
    }
    res.json({
      success: true,
      response,
      dev: {
        mainAutomation: { id, name },
        otherRecommendedAutomations: otherRecommendedAutomations.map(
          (automationId: string, index: number) => ({
            id: automationId,
            name: automationDetails[index],
          }),
        ),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred.',
      details: err,
    });
  }
});

app.post('/retriever', async (req, res) => {
  try {
    const retriever = await initializeRetriever();
    const docs = await retriever.invoke(req.body.query);
    // const names = res.json(docs);
    res.json(docs);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.post('/addDoc', async (req, res) => {
  try {
    const response = await addDocs(JSON.stringify(req.body.obj), req.body.id);
    res.json(response);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Linkedin, Recruiter Lite, Google, Youtube, Email, Product Hunt, Reddit, Website, Github, Pinterest,  TexAu Agents
// Twitter 14

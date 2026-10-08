import {insertFaq, getAllFaqs, getFaqById, updateFaq, deleteFaq} from '../models/faq.model.js';



export const createFaqController = async (req, res) => {
    try {
        const { question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status } = req.body;

        const faqId = await insertFaq({ question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status });
        return res.status(201).json({ message: 'FAQ created successfully', faqId });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllFaqsController = async (req,res) =>{

    try {
        const faqs = await getAllFaqs();
        return res.status(200).json(faqs);

    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getFaqByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await getFaqById(id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        return res.status(200).json(faq);
    } catch (error) {
        console.error('Error fetching FAQ:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateFaqController = async (req,res) =>{

    try {
        const {id} = req.params;
        const { question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status } = req.body;
        await updateFaq(id, { question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status });
        return res.status(200).json({ message: 'FAQ updated successfully' });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteFaqController = async (req,res) =>{

    try {
        const {id} = req.params;
        await deleteFaq(id);
        return res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }

}
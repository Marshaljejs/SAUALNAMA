export type QuestionType = "single" | "multiple" | "text" | "rating";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
  category: string;
  estimatedTime: string;
  respondents: number;
}

export const surveys: Survey[] = [
  {
    id: "tech-habits",
    title: "Технология әдеттері",
    description: "Сіздің күнделікті технологияларды қолдану әдеттеріңізді білгіміз келеді",
    icon: "fa-solid fa-laptop",
    category: "Технология",
    estimatedTime: "3 мин",
    respondents: 248,
    questions: [
      {
        id: "q1",
        text: "Күніне телефонды қанша сағат қолданасыз?",
        type: "single",
        required: true,
        options: [
          { id: "a", label: "1 сағаттан аз" },
          { id: "b", label: "1-3 сағат" },
          { id: "c", label: "3-5 сағат" },
          { id: "d", label: "5 сағаттан артық" },
        ],
      },
      {
        id: "q2",
        text: "Қандай қосымшаларды жиі қолданасыз?",
        type: "multiple",
        required: true,
        options: [
          { id: "a", label: "Әлеуметтік желілер" },
          { id: "b", label: "Мессенджерлер" },
          { id: "c", label: "Ойындар" },
          { id: "d", label: "Білім беру қосымшалары" },
          { id: "e", label: "Жұмыс құралдары" },
        ],
      },
      {
        id: "q3",
        text: "Жасанды интеллектті (AI) қаншалықты жиі қолданасыз?",
        type: "single",
        required: true,
        options: [
          { id: "a", label: "Күн сайын" },
          { id: "b", label: "Апта сайын" },
          { id: "c", label: "Ай сайын" },
          { id: "d", label: "Қолданбаймын" },
        ],
      },
      {
        id: "q4",
        text: "Технологияға деген қанағаттануыңызды бағалаңыз",
        type: "rating",
        required: true,
      },
      {
        id: "q5",
        text: "Технология саласында нені өзгерткіңіз келеді?",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "education",
    title: "Білім беру сапасы",
    description: "Қазақстандағы білім беру жүйесі туралы пікіріңізді білдіріңіз",
    icon: "fa-solid fa-book-open",
    category: "Білім",
    estimatedTime: "4 мин",
    respondents: 512,
    questions: [
      {
        id: "q1",
        text: "Қазіргі білім беру жүйесін қалай бағалайсыз?",
        type: "rating",
        required: true,
      },
      {
        id: "q2",
        text: "Қандай білім беру бағыты маңызды деп ойлайсыз?",
        type: "multiple",
        required: true,
        options: [
          { id: "a", label: "IT және бағдарламалау" },
          { id: "b", label: "Тілдерді үйрену" },
          { id: "c", label: "Кәсіпкерлік" },
          { id: "d", label: "Ғылым және зерттеу" },
          { id: "e", label: "Өнер және шығармашылық" },
        ],
      },
      {
        id: "q3",
        text: "Онлайн білім алуды ұнатасыз ба?",
        type: "single",
        required: true,
        options: [
          { id: "a", label: "Иә, тек онлайн" },
          { id: "b", label: "Аралас формат жақсы" },
          { id: "c", label: "Жоқ, офлайн ұнайды" },
        ],
      },
      {
        id: "q4",
        text: "Білім беру жүйесін жақсарту үшін ұсыныстарыңыз:",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "lifestyle",
    title: "Өмір салты",
    description: "Сіздің күнделікті өмір салтыңыз туралы сауалнама",
    icon: "fa-solid fa-heart-pulse",
    category: "Денсаулық",
    estimatedTime: "3 мин",
    respondents: 389,
    questions: [
      {
        id: "q1",
        text: "Аптасына қанша рет спортпен айналысасыз?",
        type: "single",
        required: true,
        options: [
          { id: "a", label: "Күн сайын" },
          { id: "b", label: "Аптасына 3-4 рет" },
          { id: "c", label: "Аптасына 1-2 рет" },
          { id: "d", label: "Айналыспаймын" },
        ],
      },
      {
        id: "q2",
        text: "Денсаулығыңызға қаншалықты көңіл бөлесіз?",
        type: "rating",
        required: true,
      },
      {
        id: "q3",
        text: "Қандай спорт түрімен айналысасыз?",
        type: "multiple",
        required: false,
        options: [
          { id: "a", label: "Жүгіру" },
          { id: "b", label: "Тренажер залы" },
          { id: "c", label: "Йога" },
          { id: "d", label: "Командалық спорт" },
          { id: "e", label: "Жүзу" },
        ],
      },
      {
        id: "q4",
        text: "Күніне қанша сағат ұйықтайсыз?",
        type: "single",
        required: true,
        options: [
          { id: "a", label: "6 сағаттан аз" },
          { id: "b", label: "6-7 сағат" },
          { id: "c", label: "7-8 сағат" },
          { id: "d", label: "8 сағаттан артық" },
        ],
      },
    ],
  },
];
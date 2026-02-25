export interface TranscriptSegment {
  timestamp: string;
  seconds: number;
  text: string;
}

export interface VideoAnalysis {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  analyzedAt: string;
  summary: string[];
  transcript: TranscriptSegment[];
  quizScore?: number;
  quizTotal?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const mockTranscript: TranscriptSegment[] = [
  { timestamp: "0:00", seconds: 0, text: "Welcome to this comprehensive introduction to machine learning fundamentals." },
  { timestamp: "0:45", seconds: 45, text: "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data." },
  { timestamp: "1:30", seconds: 90, text: "There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning." },
  { timestamp: "2:15", seconds: 135, text: "In supervised learning, we train models using labeled data, where we know the correct output for each input." },
  { timestamp: "3:00", seconds: 180, text: "Common supervised learning algorithms include linear regression, decision trees, and neural networks." },
  { timestamp: "4:00", seconds: 240, text: "Unsupervised learning deals with unlabeled data, where the algorithm tries to find patterns on its own." },
  { timestamp: "5:00", seconds: 300, text: "Clustering and dimensionality reduction are popular unsupervised learning techniques." },
  { timestamp: "6:00", seconds: 360, text: "Reinforcement learning involves an agent that learns to make decisions by interacting with an environment." },
  { timestamp: "7:00", seconds: 420, text: "Deep learning, a subset of machine learning, uses neural networks with many layers to learn complex patterns." },
  { timestamp: "8:00", seconds: 480, text: "Today, machine learning powers applications from recommendation systems to autonomous vehicles and natural language processing." },
];

export const mockSummary = [
  "Machine learning is a subset of AI focused on systems that learn from data",
  "Three main types: supervised, unsupervised, and reinforcement learning",
  "Supervised learning uses labeled data with known correct outputs",
  "Key algorithms: linear regression, decision trees, neural networks",
  "Unsupervised learning finds patterns in unlabeled data (clustering, dimensionality reduction)",
  "Reinforcement learning involves agents making decisions via environment interaction",
  "Deep learning uses multi-layer neural networks for complex pattern recognition",
  "Real-world applications: recommendation systems, autonomous vehicles, NLP",
];

export const mockQuiz: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is machine learning a subset of?",
    options: ["Data Science", "Artificial Intelligence", "Computer Vision", "Robotics"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "How many main types of machine learning are discussed?",
    options: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
  },
  {
    id: "q3",
    question: "What type of learning uses labeled data?",
    options: ["Unsupervised", "Reinforcement", "Supervised", "Semi-supervised"],
    correctIndex: 2,
  },
  {
    id: "q4",
    question: "Which is NOT a supervised learning algorithm mentioned?",
    options: ["Linear Regression", "Decision Trees", "K-Means Clustering", "Neural Networks"],
    correctIndex: 2,
  },
  {
    id: "q5",
    question: "What does deep learning use to learn complex patterns?",
    options: ["Simple rules", "Multi-layer neural networks", "Decision trees", "Random forests"],
    correctIndex: 1,
  },
];

export const mockHistory: VideoAnalysis[] = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    url: "https://www.youtube.com/watch?v=example1",
    thumbnail: "",
    duration: "8:30",
    analyzedAt: "2026-02-24",
    summary: mockSummary.slice(0, 3),
    transcript: mockTranscript.slice(0, 3),
    quizScore: 4,
    quizTotal: 5,
  },
  {
    id: "2",
    title: "React Hooks Deep Dive",
    url: "https://www.youtube.com/watch?v=example2",
    thumbnail: "",
    duration: "12:45",
    analyzedAt: "2026-02-23",
    summary: ["useState and useEffect are the most common hooks", "Custom hooks enable reusable stateful logic", "useCallback and useMemo optimize performance"],
    transcript: [],
    quizScore: 3,
    quizTotal: 5,
  },
  {
    id: "3",
    title: "CSS Grid Layout Tutorial",
    url: "https://www.youtube.com/watch?v=example3",
    thumbnail: "",
    duration: "15:20",
    analyzedAt: "2026-02-22",
    summary: ["CSS Grid provides 2D layout control", "grid-template-columns and rows define structure", "Subgrid allows nested alignment"],
    transcript: [],
  },
];

export function searchTopic(query: string, transcript: TranscriptSegment[]): TranscriptSegment[] {
  const q = query.toLowerCase();
  return transcript.filter(seg => seg.text.toLowerCase().includes(q));
}

export function simulateProcessing(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1500));
}

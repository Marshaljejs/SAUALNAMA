import { useState } from "react";

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)",
  "linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #11998e 100%)",
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)",
  "linear-gradient(135deg, #16222a 0%, #3a6186 100%)",
  "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #e94560 100%)",
];

export const useSurveyBackground = (): string => {
  const [gradient] = useState(
    () => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]
  );
  return gradient;
};

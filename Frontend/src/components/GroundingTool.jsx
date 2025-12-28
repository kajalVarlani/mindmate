import React, { useState, useEffect } from 'react';
import './GroundingTool.css';

const steps = [
  { id: 5, sense: "Sight", instruction: "List 5 things you can see:", icon: "👁️" },
  { id: 4, sense: "Touch", instruction: "List 4 things you can feel:", icon: "🖐️" },
  { id: 3, sense: "Sound", instruction: "List 3 things you hear:", icon: "👂" },
  { id: 2, sense: "Smell", instruction: "List 2 things you smell:", icon: "👃" },
  { id: 1, sense: "Taste", instruction: "List 1 thing you can taste:", icon: "👅" }
];

export default function GroundingTool() {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState(Array(5).fill("")); // Initial 5 boxes
  const [isFinished, setIsFinished] = useState(false);

  const step = steps[currentStep];

  // Update input boxes when step changes
  useEffect(() => {
    setInputs(Array(step.id).fill(""));
  }, [currentStep]);

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const isStepComplete = inputs.every(input => input.trim().length > 0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="grounding-finished">
        <div className="glow-icon">🌿</div>
        <h2 className="brand-glow">You are present.</h2>
        <p>Your mind is here, in the now. Carry this peace with you.</p>
        <button className="primary-btn" onClick={() => window.location.reload()}>Finish Session</button>
      </div>
    );
  }

  return (
    <div className="grounding-tool">
      <div className="step-header">
        <span className="step-count">Step {currentStep + 1} of 5</span>
        <h2 className="sense-title">{step.icon} {step.id} Things you {step.sense}</h2>
        <p className="sense-instruction">{step.instruction}</p>
      </div>

      <div className="grounding-input-grid">
        {inputs.map((val, index) => (
          <div key={index} className="input-wrapper">
            <span className="input-number">{index + 1}</span>
            <input
              type="text"
              className="grounding-slot"
              value={val}
              placeholder="..."
              onChange={(e) => handleInputChange(index, e.target.value)}
              autoFocus={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="tool-footer">
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${(currentStep + 1) * 20}%` }}></div>
        </div>
        <button 
          className="next-btn" 
          onClick={handleNext}
          disabled={!isStepComplete}
        >
          {currentStep === 4 ? "Complete" : "Continue"}
        </button>
      </div>
    </div>
  );
}
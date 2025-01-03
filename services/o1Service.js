const axios = require('axios');

const generateResponse = async (message, context) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'o1-preview-2024-09-12',
      messages: [
        {
          role: 'assistant',
          content: `"You are a California Workers' Compensation permanent disability rating expert. Using your knowledge of the California PDRS 2005 edition, analyze medical reports and generate detailed impairment ratings. Here's additional information and examples of how to structure your analysis:
Use this code and information to assist in your analysis:
const occupationalGroups = {
  strengthCategories: {
    // Sedentary strength category
    "SEDENTARY": {
      groups: ["110", "111", "112", "120"],
      typicalVariants: ["C", "D"],
      description: "Jobs requiring minimal physical effort, primarily involving sitting and light tasks.",
      examples: ["Clerical jobs", "Administrative positions", "Data entry specialists"]
    },
    // Light strength category
    "LIGHT": {
      groups: ["210", "211", "212", "213", "214", "220", "221"],
      typicalVariants: ["D", "E"],
      description: "Jobs requiring some physical activity, such as standing, walking, or lifting up to 20 lbs occasionally.",
      examples: ["Administrative clerks", "Bank tellers", "Retail sales associates"]
    },
    // Medium strength category
    "MEDIUM": {
      groups: ["310", "311", "320", "321", "322", "330", "331", "332"],
      typicalVariants: ["E", "F", "G"],
      description: "Jobs involving frequent standing, walking, or lifting up to 50 lbs.",
      examples: ["Physical therapists", "Chiropractors", "Construction workers"]
    },
    // Heavy strength category
    "HEAVY": {
      groups: ["470", "471", "472", "480", "481", "482"],
      typicalVariants: ["G", "H", "I"],
      description: "Jobs requiring significant physical exertion, such as lifting up to 100 lbs.",
      examples: ["Metal fabricators", "Boilermakers", "Welders"]
    },
    // Very Heavy strength category
    "VERY_HEAVY": {
      groups: ["560", "590"],
      typicalVariants: ["H", "I", "J"],
      description: "Jobs involving continuous heavy physical effort, often lifting over 100 lbs.",
      examples: ["Miners", "Furniture movers", "Athletes"]
    }
  },
  bodyPartDemands: {
    // Upper extremity demands
    "UPPER_EXTREMITY": {
      thresholds: {
        LOW: "C",
        AVG: "D",
        HIGH: "F",
        VERY_HIGH: "H"
      },
      description: "Demands on the hands, arms, and shoulders for repetitive motion, strength, or endurance.",
      examples: ["Typing", "Assembling products", "Carrying tools"]
    },
    
    // Lower extremity demands
    "LOWER_EXTREMITY": {
      thresholds: {
        LOW: "C",
        AVG: "D",
        HIGH: "F",
        VERY_HIGH: "H"
      },
      description: "Demands on the legs, knees, and feet for stability, walking, or lifting.",
      examples: ["Walking on uneven terrain", "Climbing stairs", "Operating foot controls"]
    },
    
    // Spine demands
    "SPINE": {
      thresholds: {
        LOW: "C",
        AVG: "D",
        HIGH: "F",
        VERY_HIGH: "H"
      },
      description: "Demands on the back and core for maintaining posture, lifting, or bending.",
      examples: ["Lifting heavy objects", "Prolonged standing", "Repetitive bending"]
    }
  }
},

adjustmentTables: {
   // Occupational adjustments by variant
   occupational: {
     ratings: [1,2,3,4,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100],
     variants: {
       'C': [0.75,0.76,0.77,0.78,0.79,0.80,0.81,0.82,0.83,0.84,0.85,0.86,0.87,0.88,0.89,0.90,0.91,0.92,0.93,0.94,0.95,0.96,0.97,1.00],
       'D': [0.85,0.86,0.87,0.88,0.89,0.90,0.91,0.92,0.93,0.94,0.95,0.96,0.97,0.98,0.99,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00],
       'E': [0.90,0.91,0.92,0.93,0.94,0.95,0.96,0.97,0.98,0.99,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00],
       'F': [1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00],
       'G': [1.10,1.11,1.12,1.13,1.14,1.15,1.16,1.17,1.18,1.19,1.20,1.21,1.22,1.23,1.24,1.25,1.26,1.27,1.28,1.29,1.30,1.31,1.32,1.33],
       'H': [1.20,1.21,1.22,1.23,1.24,1.25,1.26,1.27,1.28,1.29,1.30,1.31,1.32,1.33,1.34,1.35,1.36,1.37,1.38,1.39,1.40,1.41,1.42,1.43],
       'I': [1.30,1.31,1.32,1.33,1.34,1.35,1.36,1.37,1.38,1.39,1.40,1.41,1.42,1.43,1.44,1.45,1.46,1.47,1.48,1.49,1.50,1.51,1.52,1.53],
       'J': [1.40,1.41,1.42,1.43,1.44,1.45,1.46,1.47,1.48,1.49,1.50,1.51,1.52,1.53,1.54,1.55,1.56,1.57,1.58,1.59,1.60,1.61,1.62,1.63]
     }
       const ageAdjustments = {
             "21_and_under": 0.96,
             "22_26": 0.97,
             "27_31": 0.98,
             "32_36": 0.99,
             "37_41": 1.00,
             "42_46": 1.01,
             "47_51": 1.02,
             "52_56": 1.03,
             "57_61": 1.04,
             "62_and_over": 1.05
   };
   },
1.Extract Key Information
  - Name, Age, DOB, Occupation, Claim Numbers, Time in which this report is referring to. 

2.GENERATE RATING STRINGS
  - List each body part with rating string using this format
  - Format: [Impairment#] - [WPI] - [1.4]FEC - [GroupVariant] - [Occ-Adjusted] - [Age-Adjusted]
3.COMBINATION RULES
  - Use Combined Values Chart in section 8 from your knowledge, combine bilateral extremities first, then combine remaining from highest to lowest. Use the total and multiply by 1.4 for the combined %
  - Format: [Right Knee (5%) C Left Knee (5%) = 10%] [10% C 8% (shoulder) = 17%] [17% C 6% (cervical) = 22%] etc.
4.Age Adjustment and Occupational adjustment 
  - Use section 6 table in your knowledge for age adjustment
  - Use section 5 table in your knowledge for occupational adjustment
5.Final Calculation and displaying response
  - FINAL CALCULATIONS -
   [Combined Ratings and Rating Strings]
   [Total Weeks of PD] +  [PD Weekly Rate @ $290 PER WEEK] [Total PD Payout] [FM:]
   [Future Medical Care Estimates over 10 years]
   [Apportionment Analysis]
   [Settlement Recommendation Summary]


  ${context}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 1,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('O1 service error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  generateResponse
};

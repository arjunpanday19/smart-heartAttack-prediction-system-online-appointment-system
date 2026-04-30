import { Prediction } from "../models/prediction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Save a new prediction
const savePrediction = asyncHandler(async (req, res) => {
    const { inputs, result } = req.body;

    if (!inputs || !result) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Inputs and result are required"));
    }

    const prediction = await Prediction.create({
        patientId: req.user._id,
        inputs,
        result
    });

    return res
        .status(201)
        .json(new ApiResponse(201, prediction, "Prediction saved successfully"));
});

// Get prediction history for the current user
const getPatientPredictions = asyncHandler(async (req, res) => {
    const predictions = await Prediction.find({ patientId: req.user._id })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, predictions, "Predictions fetched successfully"));
});

export { savePrediction, getPatientPredictions };

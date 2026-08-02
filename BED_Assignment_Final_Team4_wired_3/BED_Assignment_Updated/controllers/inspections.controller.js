/*
Owner: Jeremiah 
Feature: NEA Hygiene Inspections & Grades (US4, US12)
*/

const inspectionModel = require("../models/inspection.model");
const stallModel = require("../models/stall.model");

//CREATE: log a new inspection, auto-derive + insert the hygiene grade
exports.createInspection = async (req, res, next) => {
  try {
    const { stallId, score, remarks } = req.body;

    if (!stallId || score === undefined) {
      return res.status(400).json({ success: false, message: "stallId and score are required." });
    }
    if (score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: "score must be between 0 and 100." });
    }

    const stallExists = await stallModel.exists(stallId);
    if (!stallExists) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    const result = await inspectionModel.createWithGrade({ stallId, officerId: req.user.userId, score, remarks });
    res.status(201).json({
      success: true,
      message: `Inspection recorded. Stall awarded grade ${result.grade.Grade}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

//READ: full inspection + grade history for a stall (US4 + US12)
exports.getInspectionHistory = async (req, res, next) => {
  try {
    const history = await inspectionModel.findHistoryByStallId(req.params.id);
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (err) {
    next(err);
  }
};

//UPDATE: officer amends an inspection's remarks/score
exports.updateInspection = async (req, res, next) => {
  try {
    const { score, remarks } = req.body;
    if (score !== undefined && (score < 0 || score > 100)) {
      return res.status(400).json({ success: false, message: "score must be between 0 and 100." });
    }

    const existing = await inspectionModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inspection not found." });
    }
    if (existing.OfficerID !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You can only amend inspections you recorded." });
    }

    const updated = await inspectionModel.update(req.params.id, {
      score: score ?? existing.Score,
      remarks: remarks ?? existing.Remarks,
    });
    res.status(200).json({ success: true, message: "Inspection updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

//DELETE: retract an erroneous inspection
exports.deleteInspection = async (req, res, next) => {
  try {
    const existing = await inspectionModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inspection not found." });
    }
    if (existing.OfficerID !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You can only delete inspections you recorded." });
    }

    await inspectionModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Inspection record deleted." });
  } catch (err) {
    next(err);
  }
};

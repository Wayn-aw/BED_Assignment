/*
Owner: Kyra 
Feature: Lodge Customer Complaint (US13)
*/

const complaintModel = require("../models/complaint.model");
const stallModel = require("../models/stall.model");

//CREATE
exports.createComplaint = async (req, res, next) => {
  try {
    const { stallId, description } = req.body;
    if (!stallId || !description) {
      return res.status(400).json({ success: false, message: "stallId and description are required." });
    }
    if (description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a description of at least 10 characters." });
    }

    const stallExists = await stallModel.exists(stallId);
    if (!stallExists) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    const complaint = await complaintModel.create({ patronId: req.user.userId, stallId, description });
    res.status(201).json({ success: true, message: "Complaint submitted. Our operator will review it shortly.", data: complaint });
  } catch (err) {
    next(err);
  }
};

//READ: own complaint history
exports.getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await complaintModel.findByPatronId(req.user.userId);
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
};

//UPDATE: Operator/Admin progresses a complaint's status
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Open", "Investigating", "Resolved", "Dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const updated = await complaintModel.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }
    res.status(200).json({ success: true, message: "Complaint status updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

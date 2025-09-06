const isCreator = (req, res, next) => {
  if (req.user.role !== "creator") {
    return res.status(403).json({ success: false, message: "Only creators can perform this action" });
  }
  next();
};


module.exports = isCreator;
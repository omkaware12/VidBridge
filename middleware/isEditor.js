const isEditor = (req, res, next) => {
  if (req.user.role !== "editor") {
    return res.status(403).json({ success: false, message: "Only editor can perform this action" });
  }
  next();
};


module.exports = isEditor;
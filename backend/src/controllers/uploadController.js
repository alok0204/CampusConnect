/**
 * Handle single image upload
 * @route POST /api/uploads/image
 * @access Private
 */
export const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded or invalid file format.',
      });
    }

    // Relative URL path to be stored in DB and served statically
    const relativeUrl = `/uploads/images/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      url: relativeUrl,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Error in uploadImage controller:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during file upload.',
      error: error.message,
    });
  }
};

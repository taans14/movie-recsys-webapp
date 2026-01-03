import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 10 },
  },
  {
    collection: "ratings",
    timestamps: true,
  }
);

ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);

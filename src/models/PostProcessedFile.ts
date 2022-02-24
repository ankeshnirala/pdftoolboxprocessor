import { Schema, Model, Document, model } from "mongoose";
import { FileStatus } from "./types"

// an interface that describes the properties
// that are required to create a new file collection
interface PostProcessedFileAttrs {
    s3file: string;
    pre_processed_file: Schema.Types.ObjectId;
    status?: FileStatus;
}

// an interface that describes the properties
// that a PreProcessedFile model has
interface PostProcessedFileModel extends Model<PostProcessedFileDocument> {
    build(attrs: PostProcessedFileAttrs): PostProcessedFileDocument
}

interface PostProcessedFileDocument extends Document {
    s3file: string;
    status: FileStatus;
    pre_processed_file: any;
}

const PostProcessedFileSchema = new Schema({
    s3file: {type: String, required: true},
    status: { type: String, required: true, enum: Object.values(FileStatus), default: FileStatus.Complete },
    pre_processed_file: {type: Schema.Types.ObjectId, ref: "PreProcessedFile"}
}, 
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
        versionKey: false,
    }
});

PostProcessedFileSchema.statics.build = (attrs: PostProcessedFileAttrs) => {
    return new PostProcessedFile(attrs);
};

const PostProcessedFile = model<PostProcessedFileDocument, PostProcessedFileModel>("PostProcessedFile", PostProcessedFileSchema);

export { PostProcessedFile }
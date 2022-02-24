import { Schema, Model, Document, model } from "mongoose";

// an interface that describes the properties
// that are required to create a new file collection
interface PreProcessedFileAttrs {
    s3file: string;
    script_name: string;
    variables: object;
}

// an interface that describes the properties
// that a PreProcessedFile model has
interface PreProcessedFileModel extends Model<PreProcessedFileDocument> {
    build(attrs: PreProcessedFileAttrs): PreProcessedFileDocument
}

interface PreProcessedFileDocument extends Document {
    s3file: string;
    script_name: string;
    variables: object;
}

const PreProcessedFileSchema = new Schema({
    s3file: {type: String, required: true},
    script_name: {type: String, required: true},
    variables: {type: Object}
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

PreProcessedFileSchema.statics.build = (attrs: PreProcessedFileAttrs) => {
    return new PreProcessedFile(attrs);
};

const PreProcessedFile = model<PreProcessedFileDocument, PreProcessedFileModel>("PreProcessedFile", PreProcessedFileSchema);

export { PreProcessedFile }
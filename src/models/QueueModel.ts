import { Schema, Model, Document, model } from "mongoose";
import { QueueStatus } from "./types";

// an interface that describes the properties
// that are required to create a new queue collection
interface QueueAttrs {
    pre_processed_file: Schema.Types.ObjectId;
    queue_number: number;
    status?: QueueStatus;
}

// an interface that describes the properties
// that a PreProcessedFile model has
interface QueueModel extends Model<QueueDocument> {
    build(attrs: QueueAttrs): QueueDocument
}

interface QueueDocument extends Document {
    pre_processed_file: any;
    queue_number: number;
    status?: QueueStatus;
}

const QueueSchema = new Schema({
    queue_number: {type: Number, required: true, default: 0},
    status: {type: String, required: true, enum: Object.values(QueueStatus), default: QueueStatus.Processing},
    pre_processed_file: {type: Schema.Types.ObjectId, ref: "PreProcessedFile"}
},{
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
        versionKey: false,
    }
});

QueueSchema.statics.build = (attrs: QueueAttrs) => {
    return new Queue(attrs);
};

const Queue = model<QueueDocument, QueueModel>("Queue", QueueSchema);

export { Queue }


import mongoose,{Schema} from 'mongoose';
import observeChangesPlugin from "../../src";
/**@constructor MainModels
 * */
const MainModelSchema = new Schema({
    name:{
        type: String,
        required: true,
        unique:true
    },
    role_id:{
        type:Schema.Types.ObjectId,
        default:null
    },
    tag_ids:{
        type:[Schema.Types.ObjectId],
        default(){
            return []
        }
    },

    created:{
        type:Date,
        default(){
            return new Date();
        }
    },
    updated:{
        type:Date,
        default:null
    }
});

MainModelSchema.virtual('role', {
    ref: 'roles', // The model to use
    localField: 'role_id', // Find aclRoles where `name`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
    options: {

    }
});

MainModelSchema.virtual('tags', {
    ref: 'tags', // The model to use
    localField: 'tag_ids', // Find aclRoles where `name`
    foreignField: '_id', // is equal to `foreignField`
    justOne: false,
    options: {

    }
});

MainModelSchema.plugin(observeChangesPlugin);

const MainModels = mongoose.model('mainModels',MainModelSchema);

export default MainModels;
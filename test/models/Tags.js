import mongoose,{Schema} from 'mongoose';
import observeChangesPlugin from "../../src";
/**
 * @constructor Tags
 * */
const TagsSchema = new Schema({
    name:{
        type: String,
        default:null
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

TagsSchema.plugin(observeChangesPlugin);

const Tags = mongoose.model('tags',TagsSchema,'tags');

export default Tags;
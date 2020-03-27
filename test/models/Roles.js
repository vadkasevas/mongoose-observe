import mongoose,{Schema} from 'mongoose';
import observeChangesPlugin from "../../src";
/**
 * @constructor Roles
 * */
const RolesSchema = new Schema({
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

RolesSchema.plugin(observeChangesPlugin);

const Roles = mongoose.model('roles',RolesSchema,'roles');

export default Roles;
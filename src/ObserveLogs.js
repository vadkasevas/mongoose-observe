import mongoose from 'mongoose';
import EJSON from 'ejson';

const Schema = new mongoose.Schema({
    type:{
        type: String,
        required: true
    },
    collectionName:{
        type:String,
        required:false
    },
    arguments: {
        type: String,
        get: function(data) {
            try {
                return EJSON.parse(data);
            } catch(e) {
                return data;
            }
        },
        set: function(data) {
            return EJSON.stringify(data);
        }
    },
    state: {
        type: String,
        get: function(data) {
            try {
                return EJSON.parse(data);
            } catch(e) {
                return data;
            }
        },
        set: function(data) {
            return EJSON.stringify(data);
        }
    },
    date:{
        type:Date
    }
}, {capped: { size: 100000000, max: 100000 }});

const ObserveLogs = mongoose.model('observeLogs',Schema);
export default ObserveLogs;
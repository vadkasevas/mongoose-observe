import ObserveLogs from "./ObserveLogs";
import ObserveCursor from "./ObserveCursor";
import {Query} from 'mongoose';
import EJSON from 'ejson';
const mongoose = require('mongoose');
import emitter from "./emitter";

const moduleMongoose = require.cache[require.resolve('mongoose')]

const bson = moduleMongoose.require('bson');
const mongodb = moduleMongoose.require('mongodb');

let isReady = false;
emitter.on('ready',()=>{
    isReady = true;
});
emitter.on('notready',()=>{
    isReady = false;
});

async function waitReady(){
    if(isReady)
        return Promise.resolve();
    return new Promise((resolve)=>{
        emitter.once('ready',resolve);
    });
}

const BsonObjectId = bson.ObjectID;
const MongodbObjectId = mongodb.ObjectId;

Query.prototype.observeChanges = function(handlers,options){
    return new ObserveCursor(this,options).observeChanges(handlers);
};

mongoose.ObjectId.prototype.toJSONValue = BsonObjectId.prototype.toJSONValue = MongodbObjectId.prototype.toJSONValue = function(){
    return this.toString();
};
MongodbObjectId.prototype.typeName=mongoose.ObjectId.prototype.typeName =BsonObjectId.prototype.typeName = function() {
    return 'ObjectID';
};
EJSON.addType('ObjectID', function fromJSONValue(json) {
    return json;
});

export default function observeChangesPlugin(schema, options) {
    schema.pre('save',function(){
        //console.log(this);
        return Promise.resolve();
    });
    schema.post('save',async function(){
        await waitReady();
        let rawDoc = this.toObject({ getters: false });
        rawDoc = EJSON.clone(rawDoc);
        new ObserveLogs({
            type:'save',
            collectionName:this.collection.name,
            arguments:[rawDoc],
            state:{
                isNew:this.isNew
            },
            date:new Date()
        }).save();
    });

    schema.post('remove', { query: true,document:true  },async function(result) {
        await waitReady();
        //let rawDoc = this.toObject({ getters: false });
        //rawDoc = EJSON.clone(rawDoc);
        //if(result.deletedCount>0) {
            new ObserveLogs({
                type: 'remove',
                collectionName: this.mongooseCollection.name,
                arguments: [EJSON.clone(this._conditions)],
                state: {},
                date: new Date()
            }).save();
        //}
    });

    schema.post(/^update/, { query: true,document:true },async function(result) {
        //console.log({result});
        await waitReady();
        if(result.nModified>0) {
            new ObserveLogs({
                type: 'update',
                collectionName: this.mongooseCollection.name,
                arguments: [EJSON.clone(this._conditions)],
                state: {},
                date: new Date()
            }).save();
        }
    });

    schema.post(/^delete/, { query: true,document:true },async function(result) {
        //console.log({result});
        await waitReady();
        if(result.deletedCount>0) {
            new ObserveLogs({
                type: 'remove',
                collectionName: this.mongooseCollection.name,
                arguments: [EJSON.clone(this._conditions)],
                state: {},
                date: new Date()
            }).save();
        }
    });


}
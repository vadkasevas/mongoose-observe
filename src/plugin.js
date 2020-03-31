import ObserveLogs from "./ObserveLogs";
import ObserveCursor from "./ObserveCursor";
import {Query} from 'mongoose';
import EJSON from 'ejson';
const mongoose = require('mongoose');
import emitter from "./emitter";
import ObserveCursorDeep from "./ObserveCursorDeep";

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

/**
 * @returns {ObserveCursor}
 * */
Query.prototype.observeChanges = function(handlers,options){
    return new ObserveCursor(this,options).observeChanges(handlers);
};

/**
 * @returns {ObserveCursor}
 * */
Query.prototype.observeDeepChanges = function(handlers,options){
    return new ObserveCursorDeep(this,options).observeChanges(handlers);
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

function collectionName(ctx){
    let result = null;
    if(ctx instanceof mongoose.Model){
        result = ctx.collection.name;
    }else if(ctx instanceof mongoose.Query){
        result = ctx.mongooseCollection.name;
    }
    return result;
}
export default function observeChangesPlugin(schema, options) {
    /*schema.pre('save',function(){
        //console.log(this);
        return Promise.resolve();
    });*/
    schema.post('save',async function(){
        await waitReady();
        let rawDoc = this.toObject({ getters: true });
        rawDoc = EJSON.clone(rawDoc);
        new ObserveLogs({
            type:'save',
            collectionName:collectionName(this),
            arguments:[rawDoc],
            state:{
                isNew:this.isNew
            },
            date:new Date()
        }).save();
    });

    schema.post(/^remove|Remove/, { query: true,document:true  },async function(result) {
        await waitReady();
        //let rawDoc = this.toObject({ getters: false });
        //rawDoc = EJSON.clone(rawDoc);
        let condition = null;
        if(result instanceof mongoose.Model){
            condition =EJSON.clone({_id:result._id});
        }else if(this instanceof mongoose.Query && result.deletedCount>0){
            condition = EJSON.clone(this._conditions);
        }

        if(condition) {
            new ObserveLogs({
                type: 'remove',
                collectionName:collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
            }).save();
        }
    });

    schema.post(/^update|Update/, { query: true,document:true },async function(result) {
        //console.log({result});
        await waitReady();
        let condition = null;
        if(result instanceof mongoose.Model){
            condition = EJSON.clone({_id:result._id});
        }else if(this instanceof mongoose.Query && result.nModified>0){
            condition = EJSON.clone(this._conditions);
        }
        if(condition) {
            new ObserveLogs({
                type: 'update',
                collectionName:collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
            }).save();
        }
    });

    schema.post(/^delete|Delete/, { query: true,document:true },async function(result) {
        //console.log({result});
        await waitReady();
        let condition = null;
        if(result instanceof mongoose.Model){
            condition = EJSON.clone({_id:result._id});
        }else if(this instanceof mongoose.Query && result.deletedCount>0){
            condition = EJSON.clone(this._conditions);
        }

        if(condition) {
            new ObserveLogs({
                type: 'remove',
                collectionName:collectionName(this),
                arguments: [condition],
                state: {},
                date: new Date()
            }).save();
        }
    });


}
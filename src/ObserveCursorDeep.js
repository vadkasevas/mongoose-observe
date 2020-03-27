import ObserveCursor from "./ObserveCursor";
import EventEmitter from 'events';
import {modelPopulate} from './../test';
import _ from 'underscore';
import MainModels from "../test/models/MainModel";

function queryEquals(query1,query2){
    if(!query1&&!query2)
        return true;
    if(!query1||!query2)
        return false;
    if(query1.op!==query2.op)
        return false;
    let serializedCondition1 = JSON.stringify(query1._conditions);
    let serializedCondition2 = JSON.stringify(query2._conditions);
    if(serializedCondition1!==serializedCondition2)
        return false;

    let serializedOptions1 = JSON.stringify(query1.options);
    let serializedOptions2 = JSON.stringify(query2.options);
    if(serializedOptions1!==serializedOptions2)
        return false;
    return true;
}

export default class ObserveCursorDeep extends EventEmitter{
    constructor (query,options) {
        super();
        this.rootQuery = query;
        this.setMaxListeners(0);
        this.rootObserver = new ObserveCursor(query,options);
        this.popData = {};
    }

    /**@param {object} handlers
     * @param {function(id:String, doc:mongoose.Document)} handlers.added
     * @param {function(id:string, changedFields:object,newDoc:mongoose.Document,oldDoc: mongoose.Document)} handlers.changed
     * @param {function(id:String, removedDoc:mongoose.Document)} handlers.removed
     * */
    observeChanges(handlers){
        let handlersWrapper = {};
        if(handlers.added){
            handlersWrapper.added = function(id,doc){
                handlers.added.apply(this,arguments);
            }
        }
        if(handlers.changed){
            handlersWrapper.changed = function(id,changedFields,newDoc,oldDoc){
                handlers.changed.apply(this,arguments);
            }
        }
        if(handlers.removed){
            handlersWrapper.removed = function(id,removedDoc){
                handlers.removed.apply(this,arguments);
            }
        }
        this.rootObserver.on('refresh',async (delay)=>{
             let populatedPaths = this.rootQuery.getPopulatedPaths();
             let models = await this.models();
             if(!_.isEmpty(models)&&_.isEmpty(populatedPaths)){
                 let newQueries = await modelPopulate.apply(this.rootQuery.mongooseCollection,[models,populatedPaths]);
                 _.each(this.popData,(observers,popName)=>{
                     if(!newQueries[popName]||_.isEmpty(newQueries[popName])){
                         
                     }
                 });
             }
        });
        this.rootObserver.observeChanges(handlersWrapper);
        return this;
    }

    models(){
        return this.rootObserver.models();
    }

    stop(){
        this.rootObserver.stop();
    }
}
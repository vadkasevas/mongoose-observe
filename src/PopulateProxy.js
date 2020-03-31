import EJSON from 'ejson';
import _ from 'underscore';

/**
 * @name PopulateProxyOptions
 * @property {Array<string>} populatedPaths
 * @property {boolean} set
 **/
export default function(doc,options){
    let changedPathes = {};

    // eslint-disable-next-line no-undef
    return new Proxy(doc,{
        get: function(target, property) {
            if(property==='__changedPathes'){
                return _.chain(changedPathes)
                .keys()
                .filter((key)=>{
                    return changedPathes[key];
                })
                .value();
            }
            if(property==='__clearChangedPathes'){
                return function(){
                    changedPathes = {};
                }
            }
            return target[property];
        },
        set: function (target, key, value, receiver) {
            if(options.populatedPaths.indexOf(key)>-1){
                let changed = JSON.stringify(target[key]) !== JSON.stringify(value );
                changedPathes[key] = changed;
            }
            if(options.set!==false)
                target[key] = value;
        },
        getOwnPropertyDescriptor(target, name){
            return Object.getOwnPropertyDescriptor(target, name);
        },
        ownKeys(target){
            return Object.getOwnPropertyNames(target);
        },
        defineProperty(target, name, propertyDescriptor){
            return Object.defineProperty(target,name,propertyDescriptor);
        },
        deleteProperty(target, name){
            return delete target[name];
        },
        preventExtensions(target){
            return Object.preventExtensions(target);
        },
        has(target, name){
            return name in target;
        }
    })
}
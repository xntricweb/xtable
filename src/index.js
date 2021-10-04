// Code added here will be run once
// whenever the node is started.

const { titleCase } = require("./util");

    
function match(value, crit) {
    if (typeof crit === 'function') return crit(value);
    return value == crit;
}

function matches(crit, entry, table) {
    switch (typeof crit) {
        case 'undefined': return true;
        case 'function': return crit(entry, table);
        case 'object':
            for(let [key, value] of Object.entries(crit)) {
                if (!entry[key]) {
                    throw new Error(`${key} is not a valid field name for criteria.`);
                }
                
                if (!match(entry[key], value)) return false; 
            }
            return true;
        default:
            throw new Error(`matcher is not implemented for criteria of ${typeof crit}`);
    }
}

const defaultCritOptions = {
    criteria: undefined,
    from: 0,
    to: undefined,
    limit: undefined,
}
function fixCritOptions(options, defaultOptions = defaultCritOptions) {
    if (typeof options == 'function') {
        return { ...defaultOptions, criteria: options }
    }
    return {...defaultOptions, ...options};
}

function generateEntryProperties(headerRow) {
    let properties = [], functions = [];

    headerRow.forEach((name, columnIndex) => {
        let fieldName = titleCase(name);
        functions.push([ fieldName, {
            value(row, val) {
                if (arguments.length > 1) {
                    if (this.readOnly) throw new Error('Write operation denied!');
                    this.dataSource[row][columnIndex] = val;
                    return this;
                }

                return this.dataSource[row][columnIndex];
            },
            enumerable: true
        }]);
        properties.push([ fieldName, {
            get() { return this.dataRow[columnIndex]},
            set(value) { 
                if (this.readOnly) throw new Error('Write operation denied!'); 
                this.dataRow[columnIndex] = value; 
            },
            enumerable: true,
        }]);
    });

    return [Object.fromEntries(properties), Object.fromEntries(functions)];
}

class XTable {
    constructor(dataSource, {
        headers, 
        readOnly=true, 
        headerRow = 0, 
        dataRowStart = 1
    } = {}) {

        if (headers) {
            this.headers = headers;
            this.dataSource = dataSource;
        }
        else {
            this.headers = dataSource[headerRow];
            this.dataSource = dataSource.slice(dataRowStart);
        }

        let xtable = this;
        headers = this.headers;
        dataSource = this.dataSource;
        
        const [entryProperties, xTableProperties] = 
            generateEntryProperties(headers, !readOnly);


        class Entry {
            get xTable() { return xtable; }
            get dataSource() { return dataSource; }

            constructor(rowIndex, dataRow) {
                if (!(rowIndex === undefined || typeof rowIndex === 'number')) {
                    throw new RangeError('rowIndex must be undefined or a number.');
                }

                if (rowIndex !== undefined) {
                    dataRow = dataSource[rowIndex];
                }

                Object.defineProperties(this, {
                    ...entryProperties,
                    rowIndex: { 
                        get() { return rowIndex; }, 
                        set(value) { 
                            rowIndex = value;
                            dataRow = dataSource[rowIndex];
                        }, 
                        enumerable: true,
                    },

                    dataRow: {
                        get() { return dataRow; },
                        set(value) {
                            rowIndex = undefined;
                            dataRow = value; 
                        }
                    }
                });
            }
        
            clone() { return new Entry(this.rowIndex, this.dataRow); }
        }


        Object.defineProperties(this, {
            ...xTableProperties,
            _EntryClass: { value: Entry },
            headers: { 
                get() { return headers; }
            },
            dataSource: {
                get() { return dataSource; }
            },
        });
    }
    
    get length() {
        return this.dataSource.length;
    }
    
    selectFirst(options) {
        let { criteria, from, to } = fixCritOptions(options);        
        let data = this.dataSource;
        let entry = this.getEntry(from);
        if (to === undefined) to = data.length;
        for(;entry.rowIndex < to; entry.rowIndex++) {
            if(matches(criteria, entry, data)) {
                return entry.clone();
            }
        }
    }
    
    *select(options) {
        let { criteria, from, to, limit } = fixCritOptions(options);
        let data = this.dataSource;
        let entry = this.getEntry(from);
        if (to === undefined) to = data.length;
        for(; entry.rowIndex < to; entry.rowIndex++) {
            if(matches(criteria, entry, data)) {
                yield entry.clone();
                if ((limit !== undefined) && (--limit <= 0)) {
                    break;
                }
            }
        }
    }
    
    selectNow(crit) {
        return [...this.select(crit)];
    }

    sort(sortFunction) {
        let entryA = this.getEntry();
        let entryB = this.getEntry();

        this.dataSource.sort((a, b) => {
            entryA.dataRow = a;
            entryB.dataRow = b;

            return sortFunction(a, b);
        })
    }

    getEntry(rowIndex) {
        return new this._EntryClass(rowIndex);
    }

    createCalculatedFields(fields) {
        const EntryProto = this._EntryClass.prototype;
        let self = this;

        Object.entries(fields).forEach((field, calc) => {
            Object.defineProperty(EntryProto, field, {
                get() { return calc(this); },
                enumerable: true
            });

            Object.defineProperties(this, field, {
                value(rowIndex) { return calc(self.getEntry(rowIndex)); },
                enumerable: true,
            })
        });
    }
    
    count(selectOptions) {
        return this.selectNow(selectOptions).length;
    }
}

module.exports = {
    XTable
}

// const {describe, it} = require('jest'); 

describe('XTable', function() {
    const testData = require('./testDataSource.json');
    const {XTable} = require('../src')

    describe('length', function() {
        test('should not count the header field', function() {
            let table = new XTable(testData);
            expect(table.length).toBe(testData.length - 1);
        })
    })

    describe('selectFirst', function() {
        test('should select the first match', function() {
            let table = new XTable(testData);
            let entry = table.selectFirst(entry => {
                // console.log('entry: %o', entry);
                return entry.pid === 'PID1792'
            });
            expect(entry).not.toBe(undefined);
            expect(entry.rowIndex).toBe(32);
        })
    })

    describe('select', function() {
        test('should select a set of items', function() {
            let table = new XTable(testData);
            let entries = [...table.select(entry => {
                // console.log('entry: %o', entry);
                return entry.pid === 'PID1792'
            })];

            entries.forEach(entry => expect(entry.pid).toBe('PID1792'));
            expect(entries).toHaveLength(17);
        })

        test('should select a set of limited items', function() {
            let table = new XTable(testData);
            let entries = [...table.select({
                limit: 4,
                criteria: entry => {
                    // console.log('entry: %o', entry);
                    return entry.pid === 'PID1792'
                }
            })];

            entries.forEach(entry => expect(entry.pid).toBe('PID1792'));
            expect(entries).toHaveLength(4);
        })

        test('should select a set of within a range', function() {
            let table = new XTable(testData);
            let entries = [...table.select({
                from: 30,
                to: 57,
                criteria: entry => {
                    // console.log('entry: %o', entry);
                    return entry.productId === '85-BH'
                }
            })];

            entries.forEach(entry => expect(entry.pid).toMatch(/ACM100340|PID1701/));
            expect(entries).toHaveLength(5);
        })
    })

    describe('selectNow', function() {
        test('should select a set of items', function() {
            let table = new XTable(testData);
            let entries = table.selectNow(entry => {
                // console.log('entry: %o', entry);
                return entry.productId === '85-BH'
            });

            entries.forEach(entry => expect(entry.pid).toMatch(/ACM100340|PID1701/));
            expect(entries).toHaveLength(13);
        })
    })

    describe('sort', function() {
        test('should sort the dataset', function() {
            let data = [['a', 'b'], [1,'f'], [3, 'z'], [2,'y'],[4,'z']];
            let descendingData = [
                {a:4, b: 'z'},
                {a:3, b: 'z'},
                {a:2, b: 'y'},
                {a:1, b:'f'}
            ];
            let ascendingData = [...descendingData].reverse();
            let descendingSort = (a, b) => b.a - a.a;
            let ascendingSort =  (a, b) => a.a - b.a;

            let table = new XTable(data);
            expect(table.sort(ascendingSort).selectNow())
                .toMatchObject(ascendingData);
            expect(table.sort(descendingSort).selectNow())
                .toMatchObject(descendingData);
        })
    })

    describe('calculated fields', function() {
        test('should support calculated fields', function() {
            let table = new XTable(testData);
            table.createCalculatedFields({
                enteredOn(entry) {
                    expect(this).toBe(table);
                    return new Date(entry.timestamp);
                }
            });

            let entry = table.selectFirst();
            expect(entry.enteredOn).toBeInstanceOf(Date);
            expect(entry.enteredOn).toEqual(new Date(entry.timestamp)); 
        })
    })
});

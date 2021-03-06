
var faker = require('faker')

var finishedCreateData = {

}
const tables = [

    {

        name: 'person',
        columns: [{
            name: 'first_name',
            faker: faker.name.firstName,
            sql: 'VARCHAR NULL'
        }, {
            name: 'last_name',
            faker: faker.name.lastName,
            sql: 'VARCHAR NULL'
        }],
        constraints: []

    },
    {

        name: 'cities',
        columns: [{
            name: 'name',
            faker: faker.address.city,
            sql: 'VARCHAR'
        }, {
            name: 'country',
            faker: faker.address.country,
            sql: 'VARCHAR'
        }],
        constraints: [
            'PRIMARY KEY (name, country)'
        ]
    },
    {

        name: 'companies',
        columns: [{
            name: 'name',
            faker: faker.company.companyName,
            sql: 'VARCHAR'
        }, {
            name: 'total_employees',
            faker: faker.random.number,
            sql: 'NUMERIC NULL'
        }],
        constraints: [
            'PRIMARY KEY (name)'
        ]
    },
    {
        await: 'companies',
        name: 'addresses',
        columns: [{
            name: 'country NULL',
            faker: faker.address.country,
            sql: 'VARCHAR'
        },
        {
            name: 'city',
            faker: faker.address.city,
            sql: 'VARCHAR NULL'
        }, {
            name: 'street',
            faker: faker.address.streetName,
            sql: 'VARCHAR NULL'
        },
        {
            name: 'company',
            faker: 'SELECT name FROM companies ORDER BY random() LIMIT 1',
            sql: 'VARCHAR'
        }],
        constraints: [
            'PRIMARY KEY (country,city,street)',
            'CONSTRAINT company_name_fkey_addresses FOREIGN KEY (company) REFERENCES public.companies(name)'

        ]
    },
    {
        await: 'companies',
        name: 'jobs',
        columns: [{
            name: 'name',
            faker: faker.name.jobTitle,
            sql: 'VARCHAR NULL'
        }, {
            name: 'company',
            faker: 'SELECT name FROM companies ORDER BY random() LIMIT 1',
            sql: 'VARCHAR'
        }],
        constraints: [
            'PRIMARY KEY (name)',
            'CONSTRAINT company_name_fkey FOREIGN KEY (company) REFERENCES public.companies(name)'
        ]
    },
    {
        await: 'jobs',
        name: 'employees',
        columns: [{
            name: 'name',
            faker: function () {
                return faker.fake('{{name.lastName}} {{name.firstName}}')
            },
            sql: 'VARCHAR NULL'
        }, {
            name: 'job',
            faker: 'SELECT name  FROM jobs  ORDER BY random() LIMIT 1',
            sql: 'VARCHAR'
        }],
        constraints: [
            'PRIMARY KEY(name)',
            'CONSTRAINT job_name_fkey FOREIGN KEY (job) REFERENCES public.jobs(name)'
        ]
    },
    {
        await: 'employees',
        name: 'phones',
        columns: [{
            name: 'phone_number',
            faker: () => {
                return faker.phone.phoneNumber().toString()
            },
            sql: 'VARCHAR NULL'
        },
        {
            name: 'employee',
            faker: 'SELECT name  FROM employees  ORDER BY random() LIMIT 1',
            sql: 'VARCHAR'
        }],
        constraints: [
            'PRIMARY KEY (phone_number)',
            'CONSTRAINT employee_name_fkey FOREIGN KEY (employee) REFERENCES public.employees(name)'
        ]
    }

]

export const migrate = async function (run) {
    let i
    function columns (table) {
        let i = 0
        const columns = table.columns
        var sql = ''
        for (; i < columns.length; i++) {
            sql += `${columns[i].name} ${columns[i].sql},`
        }
        if (table.constraints) {
            for (i = 0; i < table.constraints.length; i++) {
                sql += `${table.constraints[i]},`
            }
        }

        if (sql.length === 0) {
            return sql
        }
        return sql.substring(0, sql.length - 1)
    }
    for (i = 0; i < tables.length; i++) {
        var sql = `CREATE TABLE public.${tables[i].name} (${columns(tables[i])})`
        // console.log(sql)
        await run(sql)
    }
}

export const createFakeData = async function (run, number = 10) {
    finishedCreateData = {}
    function data (columns) {
        var data = []
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].faker) {
                var item = (typeof columns[i].faker === 'function' ? columns[i].faker() : columns[i].faker)

                if (typeof item === 'string') {
                    if (typeof columns[i].faker === 'function') {
                        item = `'${item}'`
                    } else {
                        item = `(${item})`
                    }
                }
                data.push(item)
            }
        }

        return data.join(',')
    }

    function columns (columns) {
        var cols = []
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].faker) {
                cols.push(columns[i].name)
            }
        }

        return cols.join(',')
    }

    for (let i = 0; i < tables.length; i++) {
        (async function () {
            var lock = i
            var counter = 0
            if (tables[lock].await) {
                await wait(tables[lock].await)
            }
            const done = function () {
                counter++

                if (counter === number) {
                    finishedCreateData[tables[lock].name] = true
                }
            }
            for (let j = 0; j < number; j++) {
                var sql = `INSERT INTO public.${tables[lock].name} (${columns(tables[lock].columns)}) VALUES  (${data(tables[lock].columns)})`

                    ; (async function () {
                        await run(sql)
                        done()
                    }())
            }
        }())
    }
}

async function wait (index) {
    while (!finishedCreateData[index]) {
        await new Promise(resolve => setTimeout(resolve, 200))
    }
}

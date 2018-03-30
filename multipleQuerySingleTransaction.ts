var mysql = require('mysql');

var pool = mysql.createPool('mysql://localhost');

var queries:{sql:string, values?:any}[] = [];

queries[0] = {sql:'INSERT INTO dbo.foo (bar) VALUES (?)', values:[0]};
queries[1] = {sql:'INSERT INTO dbo.foo (bar) VALUES (?)', values:[1]};
queries[2] = {sql:'INSERT INTO dbo.foo (bar) VALUES (?)', values:[2]};

const results = await multipleQueryTransaction(pool, queries);

function multipleQueryTransaction(pool:any, queries: {sql:string | QueryOptions, values?:any}[]) {
  return new Promise((resolve, reject)=> {
    pool.getConnection((err,conn) => {
      conn.beginTransaction((err)=>{

        this.execMultiQuery(conn, queries, (err:any, results:any) => {

          // if any one of queries fail, rollback and reject promise with SQL error
          if (err) {
            conn.rollback(function() {
              reject(err);
              done();
            });
          } else {
            conn.commit(function() {
              resolve(results);
              done();
            });
          }
        });
      });

      //call after promise is resolved to clean up connection
      function done() {
        conn.release();
      }
    });
  })
}
function execMultiQuery(conn:any, queries: {sql:string | QueryOptions, values?:any}[], next:any) {
  let allResults:any = [];
  let e:any;

  for(let i = 0; i < queries.length; ++i) {
    allResults.push(new Promise((resolve, reject) => {
      conn.query(queries[i].sql, queries[i].values, (err:any, res:any) => {
        if (err) {reject(err);}
        resolve(res);
      })
    }))
  }

    //wait for all DB queries to finish
  Promise.all(allResults)
    .then((values) => {return next(null, values)})
    .catch((err) => {return next(err, null)});
}


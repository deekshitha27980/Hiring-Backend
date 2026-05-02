# Delivery HQL Demo

This Maven project demonstrates Hibernate Query Language (HQL) operations on a `Delivery` entity.

## Package

- `com.klef.fsad.exam`

## Database

- Database name: `fsadendexam`
- Update MySQL credentials in `src/main/resources/hibernate.cfg.xml`
- Create the database using `create-db.sql`

## Create the database

Run the SQL script from your MySQL shell or client:

```sql
SOURCE create-db.sql;
```

If you want a dedicated user, uncomment and adjust the `CREATE USER` and `GRANT` statements inside `create-db.sql`.

## Build

From the project root (`hibernate-delivery`):

```bash
mvn clean package
```

## Run

```bash
mvn exec:java -Dexec.mainClass=com.klef.fsad.exam.ClientDemo
```

Or run the assembled JAR:

```bash
java -jar target/delivery-hql-demo-1.0-SNAPSHOT-jar-with-dependencies.jar
```

## Behavior

- Inserts two `Delivery` records using persistent objects
- Deletes one record by ID using HQL with positional parameters
- Prints remaining deliveries

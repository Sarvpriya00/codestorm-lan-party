sarvpriyaadarsh@Sarvpriyas-MacBook-Air backend % npx prisma db push --force-reset
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

The SQLite database "dev.db" at "file:./dev.db" was successfully reset.

🚀  Your database is now in sync with your Prisma schema. Done in 17ms

✔ Generated Prisma Client (v6.15.0) to ./node_modules/@prisma/client in 101ms

sarvpriyaadarsh@Sarvpriyas-MacBook-Air backend % npm run seed                    

> backend@1.0.0 seed
> ts-node prisma/seed.ts

/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
prisma/seed.ts:211:5 - error TS2322: Type '{ name: string; }' is not assignable to type 'ContestWhereUniqueInput'.
  Type '{ name: string; }' is not assignable to type '{ id: string; } & { id?: string | undefined; AND?: ContestWhereInput | ContestWhereInput[] | undefined; OR?: ContestWhereInput[] | undefined; ... 12 more ...; systemControls?: SystemControlListRelationFilter | undefined; }'.
    Property 'id' is missing in type '{ name: string; }' but required in type '{ id: string; }'.

211     where: { name: 'CodeStorm Test Contest' },
        ~~~~~

  node_modules/.prisma/client/index.d.ts:26489:5
    26489     id?: string
              ~~
    'id' is declared here.
  node_modules/.prisma/client/index.d.ts:8546:5
    8546     where: ContestWhereUniqueInput
             ~~~~~
    The expected type comes from property 'where' which is declared here on type '{ select?: ContestSelect<DefaultArgs> | null | undefined; omit?: ContestOmit<DefaultArgs> | null | undefined; include?: ContestInclude<...> | ... 1 more ... | undefined; where: ContestWhereUniqueInput; }'

    at createTSError (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:1617:30)
    at node:internal/modules/cjs/loader:1824:10
    at Object.require.extensions.<computed> [as .ts] (/Users/sarvpriyaadarsh/Desktop/code/Amity/codestorm-v2/backend/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1427:32)
    at Module._load (node:internal/modules/cjs/loader:1250:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2322 ]
}


You're getting a **TypeScript error** while running your Prisma seed script, and it's due to a **type mismatch** in the `where` clause of a Prisma query.

---

### ✅ TL;DR Fix:

You're doing something like this in your `seed.ts` file:

```ts
await prisma.contest.findUnique({
  where: { name: 'CodeStorm Test Contest' } // ❌ This is wrong
});
```

But `where` must match the `ContestWhereUniqueInput` type — and from the error, **`id` is the only unique field**.

So fix it like this:

```ts
await prisma.contest.findUnique({
  where: { id: 'some-unique-id' } // ✅ Replace with actual id
});
```

---

### 🧠 Why the Error Happened:

The error:

```
Type '{ name: string; }' is not assignable to type 'ContestWhereUniqueInput'.
```

means that Prisma expects the `where` clause to include only **unique fields** (like `id`, or any other field marked as `@unique` in your schema).

But `name` is **not unique**, so Prisma can't use it for `findUnique`.

---

### 🛠 Options to Fix

#### Option 1: Use the Unique Field (`id`)

If your `Contest` model looks like this:

```prisma
model Contest {
  id   String @id @default(cuid())
  name String
}
```

You must use the `id` for lookups like `findUnique`, `update`, `delete`, etc.:

```ts
await prisma.contest.findUnique({
  where: { id: 'some-valid-id' },
});
```

#### Option 2: Make `name` Unique in the Prisma Schema (if that makes sense)

If you really want to use `name` to uniquely identify contests, change your Prisma schema:

```prisma
model Contest {
  id   String @id @default(cuid())
  name String @unique
}
```

Then push schema changes:

```bash
npx prisma db push
```

And your original code will work:

```ts
await prisma.contest.findUnique({
  where: { name: 'CodeStorm Test Contest' },
});
```

---

### 🔁 Temporary Workaround (If You Don't Want to Use Unique)

If you just want to find by non-unique fields (like `name`), use `findFirst`:

```ts
await prisma.contest.findFirst({
  where: { name: 'CodeStorm Test Contest' },
});
```

🔸 `findFirst` can take non-unique fields, but it may return `null` or an unexpected record if multiple records match.

---

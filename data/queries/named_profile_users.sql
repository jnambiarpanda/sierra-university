-- Generates: data/named_profile_users.csv
-- Splits user_name into first_name and last_name, strips parenthetical suffixes,
-- transliterates Polish characters, and constructs email_address for each named profile.

WITH profiles AS (
  SELECT
    *
  FROM
    VALUES
      ('Grzegorz Puchawski', '11c2f418-cd1f-42cc-9b69-de8a066dd68b'),
      ('Rick Handt', 'b6980db1-eb15-4d76-b093-3164cae305c1'),
      ('Julien Benatar', 'e5174632-aade-4a9c-8c66-b0e28df10c3b'),
      ('Peter Gee', '3cc2fcf5-1d34-4b79-8cc5-8fd8092bec2d'),
      ('Heston Chipman', 'cffb74b8-3fde-499c-9672-5d06ddae65b4'),
      ('Allison Rachesky', '0c173c1a-0186-4274-b3c3-639fb5468e1c'),
      ('Jillian Holbrook', '177006b0-6fdb-4726-99e6-b2ff22c6cd30'),
      ('Jim Mcclure', 'DCEEA99F49EDE6822BA533FA6CBE9DC4'),
      ('Jason Schramm', 'cef5bbed-bfdf-483d-85d4-6d843b599658'),
      ('Jason Schramm (test)', 'f74b3aa6-db23-4830-8c24-b9d92cae13f0'),
      ('Rory Belfi', '98a025fc-8cbb-4a8f-8906-46afc2128f04'),
      ('Gary Schoenwetter', '2126abd1-25dc-4d9a-9c32-95235cca0ed4'),
      ('Paweł Chudzian', '45bfb32e-a283-49bc-a366-06ece37707a7'),
      ('Mike Allen', 'd27bb998-6e3e-4665-887c-0a71083a89e5'),
      ('Steve Blatter', 'ef4d8bb7-01c4-44e3-867c-ef5a84b6083c'),
      ('Cheryl Porro', '227c6f6d-1616-4c78-98fc-cf9fc7f6d08b'),
      ('Stephanie Elkin', 'cffe2c03-1ddf-4120-a553-6cd67eb9d356'),
      ('Jason Dixon', 'd6bd147e-3f9a-479d-98c6-ff3ed8ee9a26'),
      ('Tim Johnson', 'bf56a798-33fa-4f68-88ae-53b1093f6e5b'),
      ('Andrew Gruss', '6ab6b763-b857-4b6d-9696-fb3f18c2d348'),
      ('Yelena Yakovenko', 'bc09886c-f6f5-463d-b1d0-c1e0b40e9e0b'),
      ('Russell Labiner', '3a5f14d7-c194-4b7d-b1e4-b28296385bc0'),
      ('Craig James', '31b7df1d-f238-47d1-ab36-bdd29b4aa8b3'),
      ('Darrin Smith', 'febf7a85-4034-479a-84b5-f06e606febf0'),
      ('Michelle Mearns', '0958345c-ff96-4960-a81d-75152b2af8b7'),
      ('W.B. Peale', 'bc3ce03a-939c-4501-99c8-8c6812a02808'),
      ('Surabhi Shastri', '2ca8edbc-dcfc-42b3-a3eb-a0d53b027462'),
      ('Tom Kozlowski', '3db3340c-78c9-4a96-bb43-b91e213d445f'),
      ('Amie Tornincasa', 'f782369b-554e-4351-bf3c-08115e347537'),
      ('Susanne Lynch', '3ce152a6-bf8b-4814-9cf3-a0bcc640ec0c'),
      ('Michal Draminski', '072a6b4f-2f7b-4cbe-83c1-e9d7bbfb703a'),
      ('Cezary Chudzian', 'f6eb2fa1-4708-4560-b2a8-f8c386f65d8f'),
      ('Erin Liao', '6a0ca983-df82-4a0e-b012-9e62c498327b'),
      ('__CNN only', 'f8189294-a631-4020-bed9-d6b86cb14d8d'),
      ('__Country only', '2871eace-b502-46c3-9bb4-5bd8a10e2d43'),
      ('__Rock only', '40c7dbb4-246d-4384-a91f-951cb3fe20b1'),
      ('__Hip-Hop only', 'abb976e1-feb1-4b26-9f96-5a638afcf6ad'),
      ('__Sport Talk only', '81007aab-a9bf-4eee-8516-e0eb0912ee0f'),
      ('__Sports games only', 'f5d00f12-11ea-4785-8962-e522d926ad65'),
      ('__Spots Talk + Rock', 'b47d7ab7-8d41-428e-8eb0-93f46234e87e'),
      ('__PopRocks only', '6286dc71-02b0-473c-98d0-a8e264e07fb6'),
      ('Kristi Schneck', '3deab839-6cbe-4a2c-ab40-a780083803f3'),
      ('Russ Bernstein', 'db8b7cbc-41ea-40ae-9d29-463ff1fccfad'),
      ('Natasha Aysseh', 'a9bd4745-fd4f-4a67-9f9f-a3052effcef1'),
      ('Jarosław Sobieszek', '7e24c231-a178-45b4-b8db-3020fab42a82'),
      ('Tomasz Bawor', 'df3c33d7-d83a-422e-a260-2069a0704b00'),
      ('Sylwester Dygas', 'f9af2c8c-0b0c-4169-94a4-7c7e3eeb2d1c'),
      ('Dustin Hamerla', 'f7f6db35-736e-41e4-bf12-f542d06def1d'),
      ('Paweł Starczewski', 'edbdfef6-68b1-4469-b1e9-23dff2b3e015'),
      ('Filip Grotkowski', '6dfedea3-2aac-4c74-b509-fc2471953867'),
      ('Jen Pichichero', '62c4af1d-d72b-4659-b5ab-380679239f2b'),
      ('Jim Geier', 'ba911675-8c5c-4f1b-aec4-9a985758cfae'),
      ('Sean Gibbons', 'efde527c-95e3-4849-bf16-3d1b506a27c8'),
      ('Victoria Cope', 'ff5e2241-2a00-450b-aa08-270eb4ae215c'),
      ('Sanjay Rajput', '2dbe2ddc-56c7-459f-b125-336c5abaa23a'),
      ('Dirk Van Dall', '7165ab6f-d9cb-4593-a98e-4b132a26118c'),
      ('Rob Patterson', '6c4f4f7e-9cf3-44ec-9d24-f32f275fe380'),
      ('Bryan Pan', '6eaa48b6-5ef2-46f5-80fe-da25a7d02060'),
      ('Amol Kandalgaonkar', '0febccbb-8693-4bc2-be8c-af9405c3e15d'),
      ('__On Demand Episodes', '4bf3017c-22c0-46e0-ad78-ba7765f551ae'),
      ('Wayne Thorsen', '069c0c67-d287-4851-b8ba-351f9ed4be89'),
      ('Chris Pristera', '4b626ebf-14f6-41c4-aa4c-efd3dd749aae'),
      ('Tyler Abbott', '452b8693-cad8-49ab-9532-b691eb0b2477') AS t(user_name, profile_id)
),
name_parts AS (
  SELECT
    profile_id,
    SPLIT(user_name, ' ')[0] AS first_name,
    TRIM(
      REGEXP_REPLACE(SUBSTR(user_name, LENGTH(SPLIT(user_name, ' ')[0]) + 2), '\\s*\\([^)]*\\)', '')
    ) AS last_name
  FROM
    profiles
)
SELECT
  profile_id,
  first_name,
  last_name,
  LOWER(
    CONCAT(
      REGEXP_REPLACE(
        TRANSLATE(first_name, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ'),
        '[^a-zA-Z0-9]',
        ''
      ),
      '.',
      REGEXP_REPLACE(
        TRANSLATE(last_name, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ'),
        '[^a-zA-Z0-9]',
        ''
      ),
      '@siriusxm.com'
    )
  ) AS email_address
FROM
  name_parts
ORDER BY
  last_name,
  first_name;

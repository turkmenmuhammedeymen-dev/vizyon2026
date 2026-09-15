// ================================================================
// GEÇİCİ MIGRATION FONKSİYONU
// Kullanım: Parse.Cloud.run('migrateFromBack4App', { table: '_User' })
// İş bitince bu fonksiyonu SİL!
// ================================================================
Parse.Cloud.define("migrateFromBack4App", async (request) => {
    const BACK4APP_APP_ID = "ThIYRKlEASe177ioNjJX37easF7lVvlzWiZrGuK8";
    const BACK4APP_REST_KEY = "10GBrbAHAUCbWaAF00jDBj3bdn9YaJ5fxCrqMxoU";
    const BACK4APP_URL = "https://parseapi.back4app.com";
    
    const table = request.params.table;
    if (!table) return { error: "table parametresi gerekli (örn: '_User')" };
    
    let skip = 0;
    const limit = 50; // Küçük tut ki timeout olmasın
    let totalImported = 0;
    let errors = [];
    
    try {
        const url = `${BACK4APP_URL}/classes/${table}?limit=${limit}&skip=${skip}`;
        const response = await fetch(url, {
            headers: {
                'X-Parse-Application-Id': BACK4APP_APP_ID,
                'X-Parse-REST-API-Key': BACK4APP_REST_KEY
            }
        });
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            return { table: table, imported: 0, message: "Bu tabloda kayıt yok" };
        }
        
        for (const record of data.results) {
            try {
                const newObj = new Parse.Object(table);
                for (const key of Object.keys(record)) {
                    if (key === 'objectId' || key === 'createdAt' || key === 'updatedAt') continue;
                    newObj.set(key, record[key]);
                }
                await newObj.save(null, { useMasterKey: true });
                totalImported++;
            } catch(e) {
                errors.push(record.objectId + ": " + e.message);
            }
        }
        
        return { 
            table: table, 
            imported: totalImported, 
            total: data.results.length,
            errors: errors.slice(0, 5) // İlk 5 hatayı göster
        };
    } catch(e) {
        return { table: table, error: e.message };
    }
});

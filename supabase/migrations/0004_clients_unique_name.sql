-- Previene clientes duplicados que difieren solo en mayúsculas/espacios
-- (tume_clients no tenía ninguna protección de unicidad; findOrCreateClient
-- solo protege el camino de escritura de la app, no cualquier insert directo).
create unique index tume_clients_name_normalized_key
  on tume_clients (lower(trim(name)));

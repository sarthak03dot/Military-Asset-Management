-- Schema.sql
CREATE TABLE
    users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (
            role IN ('admin', 'base_commander', 'logistics_officer')
        ),
        base_id UUID,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    bases (
        base_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        base_name VARCHAR(100) UNIQUE NOT NULL,
        location VARCHAR(255),
        commander_user_id UUID,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (commander_user_id) REFERENCES users (user_id) ON DELETE SET NULL
    );

ALTER TABLE users ADD CONSTRAINT fk_base FOREIGN KEY (base_id) REFERENCES bases (base_id) ON DELETE SET NULL;

CREATE TABLE
    equipment_types (
        equipment_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        type_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    assets (
        asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        equipment_type_id UUID NOT NULL,
        model VARCHAR(100),
        manufacturer VARCHAR(100),
        current_base_id UUID NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (
            status IN (
                'available',
                'assigned',
                'expended',
                'in_transfer',
                'under_maintenance'
            )
        ),
        last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (equipment_type_id),
            FOREIGN KEY (current_base_id) REFERENCES bases (base_id)
    );

CREATE TABLE
    asset_balances (
        balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        balance_date DATE NOT NULL,
        base_id UUID NOT NULL,
        equipment_type_id UUID NOT NULL,
        opening_balance INT NOT NULL DEFAULT 0,
        purchases INT NOT NULL DEFAULT 0,
        transfers_in INT NOT NULL DEFAULT 0,
        transfers_out INT NOT NULL DEFAULT 0,
        assigned INT NOT NULL DEFAULT 0,
        expended INT NOT NULL DEFAULT 0,
        closing_balance INT NOT NULL DEFAULT 0,
        net_movement INT NOT NULL DEFAULT 0,
        last_calculated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (base_id) REFERENCES bases (base_id),
            FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (equipment_type_id),
            UNIQUE (balance_date, base_id, equipment_type_id)
    );

CREATE TABLE
    purchases (
        purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        asset_id UUID NOT NULL,
        base_id UUID NOT NULL,
        purchase_date TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            quantity INT NOT NULL,
            unit_cost DECIMAL(10, 2),
            total_cost DECIMAL(10, 2),
            purchased_by UUID,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
            FOREIGN KEY (base_id) REFERENCES bases (base_id),
            FOREIGN KEY (purchased_by) REFERENCES users (user_id) ON DELETE SET NULL
    );

CREATE TABLE
    transfers (
        transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        asset_id UUID NOT NULL,
        from_base_id UUID NOT NULL,
        to_base_id UUID NOT NULL,
        transfer_date TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            quantity INT NOT NULL,
            transferred_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
            completed_at TIMESTAMP
        WITH
            TIME ZONE,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
            FOREIGN KEY (from_base_id) REFERENCES bases (base_id),
            FOREIGN KEY (to_base_id) REFERENCES bases (base_id),
            FOREIGN KEY (transferred_by) REFERENCES users (user_id) ON DELETE SET NULL
    );

CREATE TABLE
    assignments (
        assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        asset_id UUID NOT NULL,
        assigned_to_user_id UUID,
        assigned_date TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            return_date TIMESTAMP
        WITH
            TIME ZONE,
            assigned_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'expended')),
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
            FOREIGN KEY (assigned_to_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
            FOREIGN KEY (assigned_by) REFERENCES users (user_id) ON DELETE SET NULL
    );

CREATE TABLE
    expenditures (
        expenditure_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        asset_id UUID NOT NULL,
        base_id UUID NOT NULL,
        expenditure_date TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            quantity INT NOT NULL,
            reason TEXT,
            expended_by UUID,
            created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
            FOREIGN KEY (base_id) REFERENCES bases (base_id),
            FOREIGN KEY (expended_by) REFERENCES users (user_id) ON DELETE SET NULL
    );

CREATE TABLE
    audit_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address INET,
        timestamp TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
    );

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_bases_base_name ON bases (base_name);

CREATE INDEX idx_assets_serial_number ON assets (serial_number);

CREATE INDEX idx_assets_current_base_id ON assets (current_base_id);

CREATE INDEX idx_asset_balances_date_base_type ON asset_balances (balance_date, base_id, equipment_type_id);

CREATE INDEX idx_purchases_base_id ON purchases (base_id);

CREATE INDEX idx_purchases_date ON purchases (purchase_date);

CREATE INDEX idx_transfers_from_base ON transfers (from_base_id);

CREATE INDEX idx_transfers_to_base ON transfers (to_base_id);

CREATE INDEX idx_transfers_date ON transfers (transfer_date);

CREATE INDEX idx_assignments_assigned_to_user ON assignments (assigned_to_user_id);

CREATE INDEX idx_expenditures_base_id ON expenditures (base_id);

CREATE INDEX idx_expenditures_date ON expenditures (expenditure_date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

CREATE INDEX idx_audit_logs_action ON audit_logs (action);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);

-- Dummy DATA
-- 1. Bases
INSERT INTO
    bases (base_id, base_name, location, commander_user_id)
VALUES
    (
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'Fort Alpha',
        'Nevada, USA',
        NULL
    ),
    (
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        'Camp Bravo',
        'Texas, USA',
        NULL
    ),
    (
        'b3c3d3e3-f3a3-3333-3333-333333333333',
        'Outpost Charlie',
        'Alaska, USA',
        NULL
    );

-- 2. Users
INSERT INTO
    users (
        user_id,
        username,
        password_hash,
        email,
        role,
        base_id
    )
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'adminuser',
        '$2a$10$w0X2yM3Z4N5O6P7Q8R9S.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J',
        'admin@example.com',
        'admin',
        NULL
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'fortalpha_commander',
        '$2a$10$w0X2yM3Z4N5O6P7Q8R9S.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J',
        'commander.alpha@example.com',
        'base_commander',
        'b1a1c1d1-e1f1-1111-1111-111111111111'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'logistics_officer1',
        '$2a$10$w0X2yM3Z4N5O6P7Q8R9S.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J',
        'logistics1@example.com',
        'logistics_officer',
        'b1a1c1d1-e1f1-1111-1111-111111111111'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'logistics_officer2',
        '$2a$10$w0X2yM3Z4N5O6P7Q8R9S.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J',
        'logistics2@example.com',
        'logistics_officer',
        'b2b2c2d2-e2f2-2222-2222-222222222222'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'soldier_john',
        '$2a$10$w0X2yM3Z4N5O6P7Q8R9S.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J',
        'john.doe@example.com',
        'logistics_officer',
        'b1a1c1d1-e1f1-1111-1111-111111111111'
    );

-- Update bases with commander_user_id
UPDATE bases
SET
    commander_user_id = '22222222-2222-2222-2222-222222222222'
WHERE
    base_id = 'b1a1c1d1-e1f1-1111-1111-111111111111';

-- 3. Equipment Types
INSERT INTO
    equipment_types (equipment_type_id, type_name, description)
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'Assault Rifle',
        'Standard issue infantry weapon'
    ),
    (
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'Tank',
        'Main battle tank'
    ),
    (
        '7d793037-a076-4d85-b4a6-66d6b6f4e4b5',
        'Ammunition (5.56mm)',
        '5.56mm NATO rounds for rifles'
    ),
    (
        '8e296a06-7a6d-4d8a-8e6e-7f7e7f7e7f7e',
        'Humvee',
        'High Mobility Multipurpose Wheeled Vehicle'
    );

-- 4. Assets
INSERT INTO
    assets (
        asset_id,
        serial_number,
        equipment_type_id,
        model,
        manufacturer,
        current_base_id,
        status
    )
VALUES
    (
        'a1a1b1c1-1d1e-1111-1111-111111111111',
        'AR-15-SN-001',
        '550e8400-e29b-41d4-a716-446655440000',
        'M4 Carbine',
        'Colt',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'available'
    ),
    (
        'a2b2c2d2-2e2f-2222-2222-222222222222',
        'T-90-SN-001',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'T-90S',
        'Uralvagonzavod',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        'available'
    ),
    (
        'a3c3d3e3-3f3a-3333-3333-333333333333',
        'AMMO-556-BATCH-001',
        '7d793037-a076-4d85-b4a6-66d6b6f4e4b5',
        'Standard',
        'Federal',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'available'
    ),
    (
        'a4d4e4f4-4a4b-4444-4444-444444444444',
        'HUMVEE-SN-001',
        '8e296a06-7a6d-4d8a-8e6e-7f7e7f7e7f7e',
        'M1151',
        'AM General',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'available'
    ),
    (
        'a5e5f5a5-5b5c-5555-5555-555555555555',
        'AR-15-SN-002',
        '550e8400-e29b-41d4-a716-446655440000',
        'M4 Carbine',
        'Colt',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        'available'
    );

INSERT INTO
    purchases (
        purchase_id,
        asset_id,
        base_id,
        quantity,
        unit_cost,
        total_cost,
        purchased_by,
        purchase_date
    )
VALUES
    (
        '11111111-1111-1111-1111-000000000001',
        'a1a1b1c1-1d1e-1111-1111-111111111111',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        1,
        1200.00,
        1200.00,
        '33333333-3333-3333-3333-333333333333',
        '2024-07-01 10:00:00+00'
    ),
    (
        '22222222-2222-2222-2222-000000000002',
        'a3c3d3e3-3f3a-3333-3333-333333333333',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        5000,
        0.50,
        2500.00,
        '33333333-3333-3333-3333-333333333333',
        '2024-07-01 10:30:00+00'
    ),
    (
        '33333333-3333-3333-3333-000000000003',
        'a2b2c2d2-2e2f-2222-2222-222222222222',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        1,
        5000000.00,
        5000000.00,
        '44444444-4444-4444-4444-444444444444',
        '2024-07-02 11:00:00+00'
    );

INSERT INTO
    transfers (
        transfer_id,
        asset_id,
        from_base_id,
        to_base_id,
        quantity,
        transferred_by,
        status,
        transfer_date,
        completed_at
    )
VALUES
    (
        '44444444-4444-4444-4444-000000000004',
        'a4d4e4f4-4a4b-4444-4444-444444444444',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        1,
        '33333333-3333-3333-3333-333333333333',
        'completed',
        '2024-07-03 14:00:00+00',
        '2024-07-03 14:00:00+00'
    ),
    (
        '55555555-5555-5555-5555-000000000005',
        'a1a1b1c1-1d1e-1111-1111-111111111111',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        'b3c3d3e3-f3a3-3333-3333-333333333333',
        1,
        '11111111-1111-1111-1111-111111111111',
        'completed',
        '2024-07-04 09:00:00+00',
        '2024-07-04 09:00:00+00'
    );

INSERT INTO
    assignments (
        assignment_id,
        asset_id,
        assigned_to_user_id,
        assigned_by,
        status,
        assigned_date
    )
VALUES
    (
        '66666666-6666-6666-6666-000000000006',
        'a1a1b1c1-1d1e-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222',
        'active',
        '2024-07-05 08:00:00+00'
    ),
    (
        '77777777-7777-7777-7777-000000000007',
        'a5e5f5a5-5b5c-5555-5555-555555555555',
        '44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222',
        'active',
        '2024-07-05 09:00:00+00'
    );

INSERT INTO
    expenditures (
        expenditure_id,
        asset_id,
        base_id,
        quantity,
        reason,
        expended_by,
        expenditure_date
    )
VALUES
    (
        '88888888-8888-8888-8888-000000000008',
        'a3c3d3e3-3f3a-3333-3333-333333333333',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        1000,
        'Training exercise',
        '33333333-3333-3333-3333-333333333333',
        '2024-07-06 13:00:00+00'
    ),
    (
        '99999999-9999-9999-9999-000000000009',
        'a3c3d3e3-3f3a-3333-3333-333333333333',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        500,
        'Field operation',
        '33333333-3333-3333-3333-333333333333',
        '2024-07-07 15:00:00+00'
    );

INSERT INTO
    audit_logs (
        log_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        timestamp
    )
VALUES
    (
        'aaaaaa1a-aaaa-1111-1111-00000000000a',
        '33333333-3333-3333-3333-333333333333',
        'purchase_created',
        'purchases',
        '11111111-1111-1111-1111-000000000001',
        '{"asset": "Assault Rifle", "quantity": 1}',
        '192.168.1.1',
        '2024-07-01 10:00:00+00'
    ),
    (
        'bbbbbb2b-bbbb-2222-2222-00000000000b',
        '33333333-3333-3333-3333-333333333333',
        'expenditure_created',
        'expenditures',
        '88888888-8888-8888-8888-000000000008',
        '{"reason": "Training exercise", "quantity": 1000}',
        '192.168.1.2',
        '2024-07-06 13:00:00+00'
    ),
    (
        'cccccc3c-cccc-3333-3333-00000000000c',
        '11111111-1111-1111-1111-111111111111',
        'transfer_completed',
        'transfers',
        '55555555-5555-5555-5555-000000000005',
        '{"asset": "Assault Rifle", "from_base": "Fort Alpha", "to_base": "Outpost Charlie"}',
        '192.168.1.3',
        '2024-07-04 09:00:00+00'
    );

INSERT INTO
    asset_balances (
        balance_id,
        balance_date,
        base_id,
        equipment_type_id,
        opening_balance,
        purchases,
        transfers_in,
        transfers_out,
        assigned,
        expended,
        closing_balance,
        net_movement
    )
VALUES
    (
        '11111111-1111-1111-1111-000000000011',
        '2024-07-01',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        '550e8400-e29b-41d4-a716-446655440000',
        0,
        1,
        0,
        1,
        1,
        0,
        0,
        -1
    ) (
        '22222222-2222-2222-2222-000000000022',
        '2024-07-01',
        'b1a1c1d1-e1f1-1111-1111-111111111111',
        '7d793037-a076-4d85-b4a6-66d6b6f4e4b5',
        0,
        5000,
        0,
        0,
        0,
        1500,
        3500,
        3500
    ),
    (
        '33333333-3333-3333-3333-000000000033',
        '2024-07-02',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        1
    ),
    (
        '44444444-4444-4444-4444-000000000044',
        '2024-07-03',
        'b2b2c2d2-e2f2-2222-2222-222222222222',
        '8e296a06-7a6d-4d8a-8e6e-7f7e7f7e7f7e',
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        1
    ),
    (
        '55555555-5555-5555-5555-000000000055',
        '2024-07-04',
        'b3c3d3e3-f3a3-3333-3333-333333333333',
        '550e8400-e29b-41d4-a716-446655440000',
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        1
    );

SELECT
    *
FROM
    bases;

SELECT
    *
FROM
    users;

SELECT
    *
FROM
    equipment_types;

SELECT
    *
FROM
    assets;

SELECT
    *
FROM
    purchases;

SELECT
    *
FROM
    transfers;

SELECT
    *
FROM
    assignments;

SELECT
    *
FROM
    expenditures;

SELECT
    *
FROM
    asset_balances;

SELECT
    *
FROM
    audit_logs;
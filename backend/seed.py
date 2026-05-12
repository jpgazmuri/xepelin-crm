from database import SessionLocal, engine
import models
from datetime import date, timedelta
import random
import bcrypt

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# KAMs
kams_data = [
    {"name": "Valentina Rojas",  "email": "v.rojas@xepelin.com",  "country": "CL", "password": "xepelin123"},
    {"name": "Andrés Fuentes",   "email": "a.fuentes@xepelin.com","country": "MX", "password": "xepelin123"},
    {"name": "Camila Torres",    "email": "c.torres@xepelin.com", "country": "CL", "password": "xepelin123"},
    {"name": "JP Gazmuri",       "email": "jpgazmuric@gmail.com", "country": "CL", "password": None},
]

kams_by_email = {}
for k in kams_data:
    kam = models.KAM(
        name=k["name"],
        email=k["email"],
        country=k["country"],
        password_hash=hash_password(k["password"]) if k["password"] else None,
    )
    db.add(kam)
    db.flush()  # obtiene el id sin hacer commit
    kams_by_email[k["email"]] = kam

db.commit()

# Empresas — referenciadas por email del KAM
companies_data = [
    # Valentina (CL)
    {"name": "Constructora Andes SpA",   "industry": "construccion", "country": "CL", "status": "at_risk",  "kam": "v.rojas@xepelin.com",  "days": (90, 365),  "n": 3},
    {"name": "Retail Sur Ltda",          "industry": "retail",       "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 30),    "n": 12},
    {"name": "Maderas del Pacífico",     "industry": "manufactura",  "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 60),    "n": 8},
    {"name": "Logística Central SA",     "industry": "servicios",    "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 15),    "n": 15},
    {"name": "TechPyme Chile",           "industry": "tecnologia",   "country": "CL", "status": "at_risk",  "kam": "v.rojas@xepelin.com",  "days": (60, 180),  "n": 4},
    {"name": "Agrícola Sur SpA",         "industry": "agricultura",  "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 45),    "n": 10},
    {"name": "Alimentos Bio SpA",        "industry": "manufactura",  "country": "CL", "status": "churned",  "kam": "v.rojas@xepelin.com",  "days": (180, 365), "n": 2},
    {"name": "Distribuidora Central",    "industry": "retail",       "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 20),    "n": 18},
    {"name": "Ferretería Los Andes",     "industry": "retail",       "country": "CL", "status": "at_risk",  "kam": "v.rojas@xepelin.com",  "days": (45, 120),  "n": 5},
    {"name": "Servicios Norte Ltda",     "industry": "servicios",    "country": "CL", "status": "active",   "kam": "v.rojas@xepelin.com",  "days": (0, 30),    "n": 9},

    # Andrés (MX)
    {"name": "Construcciones CDMX SA",   "industry": "construccion", "country": "MX", "status": "at_risk",  "kam": "a.fuentes@xepelin.com", "days": (70, 250),  "n": 3},
    {"name": "Retail Guadalajara SA",    "industry": "retail",       "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 20),    "n": 16},
    {"name": "Manufacturas Monterrey",   "industry": "manufactura",  "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 35),    "n": 13},
    {"name": "Servicios Bajío SA",       "industry": "servicios",    "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 15),    "n": 17},
    {"name": "TechPyme México",          "industry": "tecnologia",   "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 45),    "n": 9},
    {"name": "Alimentos Pacífico MX",    "industry": "manufactura",  "country": "MX", "status": "churned",  "kam": "a.fuentes@xepelin.com", "days": (150, 365), "n": 2},
    {"name": "Logística Central MX",     "industry": "servicios",    "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 25),    "n": 12},
    {"name": "Ferretería Nacional MX",   "industry": "retail",       "country": "MX", "status": "at_risk",  "kam": "a.fuentes@xepelin.com", "days": (60, 180),  "n": 4},
    {"name": "Textiles Jalisco SA",      "industry": "manufactura",  "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 30),    "n": 10},
    {"name": "Agro Oaxaca SA de CV",     "industry": "agricultura",  "country": "MX", "status": "active",   "kam": "a.fuentes@xepelin.com", "days": (0, 50),    "n": 8},

    # Camila (CL)
    {"name": "Viña del Mar Trading",     "industry": "retail",       "country": "CL", "status": "active",   "kam": "c.torres@xepelin.com",  "days": (0, 10),    "n": 20},
    {"name": "Software House Chile",     "industry": "tecnologia",   "country": "CL", "status": "active",   "kam": "c.torres@xepelin.com",  "days": (0, 25),    "n": 14},
    {"name": "Pesca del Sur SA",         "industry": "agricultura",  "country": "CL", "status": "at_risk",  "kam": "c.torres@xepelin.com",  "days": (50, 200),  "n": 3},
    {"name": "Minera Los Lagos",         "industry": "manufactura",  "country": "CL", "status": "churned",  "kam": "c.torres@xepelin.com",  "days": (200, 365), "n": 1},
    {"name": "Transporte Austral Ltda",  "industry": "servicios",    "country": "CL", "status": "active",   "kam": "c.torres@xepelin.com",  "days": (0, 40),    "n": 11},

    # JP (CL)
    {"name": "Innovatech SpA",           "industry": "tecnologia",   "country": "CL", "status": "active",   "kam": "jpgazmuric@gmail.com",  "days": (0, 20),    "n": 14},
    {"name": "Exportadora del Norte",    "industry": "agricultura",  "country": "CL", "status": "active",   "kam": "jpgazmuric@gmail.com",  "days": (0, 35),    "n": 11},
    {"name": "Inmobiliaria Los Robles",  "industry": "construccion", "country": "CL", "status": "at_risk",  "kam": "jpgazmuric@gmail.com",  "days": (60, 200),  "n": 4},
    {"name": "MedSupply Chile",          "industry": "servicios",    "country": "CL", "status": "active",   "kam": "jpgazmuric@gmail.com",  "days": (0, 15),    "n": 16},
    {"name": "Confecciones Sur Ltda",    "industry": "manufactura",  "country": "CL", "status": "churned",  "kam": "jpgazmuric@gmail.com",  "days": (180, 365), "n": 2},
    {"name": "FinTech Austral SpA",      "industry": "tecnologia",   "country": "CL", "status": "active",   "kam": "jpgazmuric@gmail.com",  "days": (0, 10),    "n": 20},
    {"name": "Viajes del Pacífico",      "industry": "servicios",    "country": "CL", "status": "at_risk",  "kam": "jpgazmuric@gmail.com",  "days": (45, 150),  "n": 5},
]

companies = []
for cd in companies_data:
    kam = kams_by_email[cd["kam"]]
    # c = models.Company(
    #     name=cd["name"],
    #     industry=cd["industry"],
    #     country=cd["country"],
    #     assigned_kam_id=kam.id,
    #     onboarding_date=date.today() - timedelta(days=random.randint(60, 900)),
    #     status=cd["status"],
    # )

    # Dentro del for cd in companies_data, al crear el Company:
    if cd["status"] == "active" and cd["n"] > 10:
        credit_limit = random.uniform(50_000_000, 200_000_000)
    elif cd["status"] == "active":
        credit_limit = random.uniform(10_000_000, 50_000_000)
    elif cd["status"] == "at_risk":
        credit_limit = random.uniform(5_000_000, 20_000_000)
    else:
        credit_limit = random.uniform(1_000_000, 5_000_000)

    c = models.Company(
        name=cd["name"],
        industry=cd["industry"],
        country=cd["country"],
        assigned_kam_id=kams_by_email[cd["kam"]].id,
        onboarding_date=date.today() - timedelta(days=random.randint(60, 900)),
        status=cd["status"],
        credit_limit=credit_limit,
    )

    companies.append((c, cd))
    db.add(c)
db.commit()

# Operaciones
products = ["factoring", "confirming", "capital_trabajo"]

for company, cd in companies:
    for _ in range(cd["n"]):
        days_ago = random.randint(cd["days"][0], cd["days"][1])
        op_date  = date.today() - timedelta(days=days_ago)
        due_date = op_date + timedelta(days=random.choice([30, 60, 90]))

        if cd["status"] == "active" and cd["n"] > 10:
            amount = random.uniform(5_000_000, 50_000_000)
        elif cd["status"] == "at_risk":
            amount = random.uniform(500_000, 8_000_000)
        else:
            amount = random.uniform(200_000, 3_000_000)

        if cd["status"] == "at_risk":
            status = random.choice(["completed", "completed", "overdue", "overdue"])
        else:
            status = random.choice(["completed", "completed", "completed", "completed", "overdue"])

        db.add(models.Operation(
            company_id=company.id,
            product_type=random.choice(products),
            amount=amount,
            operation_date=op_date,
            due_date=due_date,
            status=status
        ))

# Interacciones
channels = ["whatsapp", "email", "call"]
summaries_positive = [
    "Cliente muy activo, preguntó por nuevos productos de financiamiento.",
    "Reunión exitosa, cliente planea aumentar volumen el próximo trimestre.",
    "Cliente satisfecho con las tasas, evalúa usar confirming con proveedor principal.",
    "Solicitud de ampliación de línea de crédito. Perfil favorable.",
]
summaries_negative = [
    "Sin respuesta al primer contacto. Se enviará seguimiento por email.",
    "Cliente indica dificultades de flujo de caja. Monitorear de cerca.",
    "Seguimiento de operación vencida. Cliente espera pago de su cliente.",
    "Cliente evalúa competencia. Precio es el principal factor.",
]
summaries_neutral = [
    "Llamada de bienvenida, se explicaron productos disponibles.",
    "Consulta por tasas de financiamiento de facturas de largo plazo.",
    "Cliente solicitó simulación de capital de trabajo.",
    "Actualización de datos de contacto.",
]

for company, cd in companies:
    for _ in range(random.randint(2, 5)):
        if cd["status"] == "active" and cd["n"] > 10:
            summary = random.choice(summaries_positive)
        elif cd["status"] in ["at_risk", "churned"]:
            summary = random.choice(summaries_negative)
        else:
            summary = random.choice(summaries_neutral)

        db.add(models.Interaction(
            company_id=company.id,
            channel=random.choice(channels),
            summary=summary,
            interaction_date=date.today() - timedelta(days=random.randint(0, 120))
        ))

db.commit()
db.close()
print(f"✅ Seed completado: {len(companies)} empresas, {len(kams_data)} KAMs")
print("Credenciales:")
for k in kams_data:
    if k["password"]:
        print(f"  {k['email']} / {k['password']}")
    else:
        print(f"  {k['email']} / OAuth (Google)")
// prisma/seed.ts — Popula o banco com dados reais das planilhas
import { PrismaClient, UserRole, AcervoStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ── Usuário Admin padrão ───────────────────────────────────
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@sistema.com',
      senha: senhaHash,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // ── Categorias ────────────────────────────────────────────
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nome: 'Painéis e Capas' },
      update: {},
      create: { nome: 'Painéis e Capas', descricao: 'Painéis decorativos e capas de mesa', cor: '#6366f1' },
    }),
    prisma.categoria.upsert({
      where: { nome: 'Bandejas e Boleiras' },
      update: {},
      create: { nome: 'Bandejas e Boleiras', descricao: 'Bandejas e suportes para bolos', cor: '#f59e0b' },
    }),
    prisma.categoria.upsert({
      where: { nome: 'Mesas e Móveis' },
      update: {},
      create: { nome: 'Mesas e Móveis', descricao: 'Mesas e estruturas decorativas', cor: '#10b981' },
    }),
    prisma.categoria.upsert({
      where: { nome: 'Decoração' },
      update: {},
      create: { nome: 'Decoração', descricao: 'Itens decorativos variados', cor: '#ec4899' },
    }),
    prisma.categoria.upsert({
      where: { nome: 'Outros' },
      update: {},
      create: { nome: 'Outros', descricao: 'Outros itens', cor: '#6b7280' },
    }),
  ]);
  console.log('✅ Categorias criadas:', categorias.length);

  const catPaineis  = categorias[0];
  const catBandejas = categorias[1];
  const catMesas    = categorias[2];
  const catDecoracao = categorias[3];

  // ── Acervo (dados reais da planilha) ──────────────────────
  const itensAcervo = [
    { nome: 'Trio de Cilindros',                   quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Painel Romano',                        quantidade: 2, categoriaId: catPaineis.id  },
    { nome: 'Painel Redondo',                       quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Redonda Azul Bebe',               quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Redonda Rosa com Gliter',         quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Redonda Margarida',               quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Cilindro Azul Bebe',              quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Cilindro Rosa Bebe',              quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Cilindro Rosa Pink',              quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Painel Romano Rosa Pink/Laranja', quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Painel Romano Vermelha/Azul',     quantidade: 0, categoriaId: catPaineis.id,  status: AcervoStatus.INATIVO },
    { nome: 'Capa Redonda Samba',                   quantidade: 0, categoriaId: catPaineis.id,  status: AcervoStatus.INATIVO },
    { nome: 'Capa Redonda Azul Geométrico',         quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Capa Painel Romano Branca/Preta',      quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Adesivo NSª Aparecida',                quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Capa Cilindro Rosa Dourada',           quantidade: 1, categoriaId: catPaineis.id  },
    { nome: 'Bandejas Brancas',                     quantidade: 4, categoriaId: catBandejas.id },
    { nome: 'Bandejas Azul Bebe',                   quantidade: 2, categoriaId: catBandejas.id },
    { nome: 'Bandejas Transparentes',               quantidade: 4, categoriaId: catBandejas.id },
    { nome: 'Bandejas MDF Dourado',                 quantidade: 2, categoriaId: catBandejas.id },
    { nome: 'Bandeja Aramada Espelhada',            quantidade: 2, categoriaId: catBandejas.id },
    { nome: 'Bandeja Dourada Espelhada',            quantidade: 1, categoriaId: catBandejas.id },
    { nome: 'Boleira Transparente',                 quantidade: 1, categoriaId: catBandejas.id },
    { nome: 'Boleira Branca',                       quantidade: 1, categoriaId: catBandejas.id },
    { nome: 'Boleira MDF com Dourado',              quantidade: 1, categoriaId: catBandejas.id },
    { nome: 'Trio Mesa MDF Cor Madeira',            quantidade: 1, categoriaId: catMesas.id    },
    { nome: 'Placa Happy Birthday',                 quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Bolo Falso Branco',                    quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Bolo Falso Laranja e Rosa',            quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Trio de Mesas Brancas',                quantidade: 1, categoriaId: catMesas.id    },
    { nome: 'Display Margaridas',                   quantidade: 5, categoriaId: catDecoracao.id },
    { nome: 'Vaso Marrom Plástico',                 quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Buchinho',                             quantidade: 1, categoriaId: catDecoracao.id },
    { nome: 'Mesa MDF Marrom e Branca P',           quantidade: 1, categoriaId: catMesas.id    },
    { nome: 'Mesa MDF Marrom e Branca M',           quantidade: 1, categoriaId: catMesas.id    },
    { nome: 'Mesa MDF Marrom e Branca G',           quantidade: 1, categoriaId: catMesas.id    },
  ];

  for (const item of itensAcervo) {
    const statusFinal = item.status ?? (item.quantidade > 0 ? AcervoStatus.DISPONIVEL : AcervoStatus.INATIVO);
    await prisma.acervo.upsert({
      where: { codigoInterno: item.nome.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        nome: item.nome,
        quantidadeTotal: item.quantidade,
        quantidadeAtual: item.quantidade,
        status: statusFinal,
        categoriaId: item.categoriaId,
        codigoInterno: item.nome.toLowerCase().replace(/\s+/g, '-'),
        criadoPorId: admin.id,
      },
    });
  }
  console.log('✅ Acervo populado:', itensAcervo.length, 'itens');

  // ── Cliente de exemplo SEM CPF fixo ──────────────────────
  // Upsert por nome para evitar duplicatas em re-seeds
  const clienteExistente = await prisma.cliente.findFirst({
    where: { nome: 'Fernanda (Exemplo)' },
  });

  if (!clienteExistente) {
    await prisma.cliente.create({
      data: {
        nome: 'Fernanda (Exemplo)',
        telefone: '(35) 99000-0000',
        cidade: 'Itajubá',
      },
    });
  }
  console.log('✅ Cliente exemplo criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Login: admin@sistema.com');
  console.log('🔑 Senha: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

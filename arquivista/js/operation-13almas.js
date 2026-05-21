/**
 * OPERATION_13ALMAS
 * 
 * Script Secreto para Invocar as Almas Enterradas
 * Desenterrando dados públicos sobre os 13 desaparecidos
 */

class Operation13Almas {
  constructor(terminalInstance) {
    this.terminal = terminalInstance;
    this.isInvoked = false;
    this.soulsFound = new Set();
    this.theThirteenAlmas = [
      'TIBIRIÇÁ',
      'SARACURA',
      'TAMANDUATEÍ',
      'TIETÊ',
      'PINHEIROS',
      'CABUÇU',
      'ARICANDUVA',
      'MOOCA',
      'GUARAPIRANGA',
      'BILLINGS',
      'MATO GROSSO',
      'JOCA',
      'O_GUARDIÃO'
    ];
  }

  /**
   * INVOCAR OPERAÇÃO
   */
  async invoke() {
    this.terminal.println('', 'output');
    this.terminal.println('█████████████████████████████████████████████████████████', 'system');
    this.terminal.println('                 🕯️  OPERATION_13ALMAS  🕯️', 'system');
    this.terminal.println('     Invocando as 13 Almas Soterradas de São Paulo', 'system');
    this.terminal.println('█████████████████████████████████████████████████████████', 'system');
    this.terminal.println('', 'output');

    await this.ritualDeInvocacao();

    this.isInvoked = true;

    this.terminal.println('', 'output');
    this.terminal.println('┌─────────────────────────────────────────────────────┐', 'success');
    this.terminal.println('│  ✓ OPERATION_13ALMAS INVOCADA COM SUCESSO           │', 'success');
    this.terminal.println('│                                                     │', 'success');
    this.terminal.println('│  As 13 Almas Despertaram.                          │', 'hint');
    this.terminal.println('│  Elas sussurram dados públicos da profundidade.     │', 'hint');
    this.terminal.println('│                                                     │', 'success');
    this.terminal.println('│  Comando disponível:                               │', 'output');
    this.terminal.println('│  > summon [alma_nome]                              │', 'output');
    this.terminal.println('│  > summon all                                       │', 'output');
    this.terminal.println('│                                                     │', 'output');
    this.terminal.println('│  Almas invocáveis:                                 │', 'hint');
    this.terminal.println('│  ▸ TIBIRIÇÁ  ▸ SARACURA  ▸ TAMANDUATEÍ            │', 'hint');
    this.terminal.println('│  ▸ TIETÊ     ▸ PINHEIROS ▸ CABUÇU                 │', 'hint');
    this.terminal.println('│  ▸ ARICANDUVA▸ MOOCA     ▸ GUARAPIRANGA            │', 'hint');
    this.terminal.println('│  ▸ BILLINGS  ▸ MATO GROSSO ▸ JOCA ▸ O_GUARDIÃO   │', 'hint');
    this.terminal.println('└─────────────────────────────────────────────────────┘', 'success');
  }

  async ritualDeInvocacao() {
    const linhas = [
      { text: '  [Conectando aos arquivos do subsolo...]', type: 'system' },
      { text: '  [Despertando 13 vozes do silêncio...]', type: 'system' },
      { text: '  [████░░░░░░] 40% - Tibiriçá acorda', type: 'system' },
      { text: '  [████████░░] 60% - Saracura ressurge', type: 'system' },
      { text: '  [██████████] 100% - Guardião emerge', type: 'system' },
      { text: '  ', type: 'output' },
      { text: '  🕯️ Uma vela acende-se para cada alma.', type: 'warning' },
      { text: '  🕯️ Treze chamas iluminam o subsolo.', type: 'warning' },
      { text: '  🕯️ A verdade enterrada sobe à superfície.', type: 'warning' }
    ];

    for (const linha of linhas) {
      // Usa DecryptedText do ReactBits se disponível, senão imprime direto
      if (window.ReactBitsEffects && linha.text.trim().length > 0) {
        // Cria a linha no terminal com classe de descriptografia
        const lineEl = this.terminal.printlnEl(linha.text, linha.type + ' terminal-line-decrypting');
        if (lineEl) {
          await window.ReactBitsEffects.decryptString(linha.text, (current) => {
            lineEl.textContent = current;
          });
          lineEl.classList.remove('terminal-line-decrypting');
          lineEl.classList.add('terminal-line-revealed');
        } else {
          await this.terminal.println(linha.text, linha.type);
        }
      } else {
        await this.terminal.println(linha.text, linha.type);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  async summon(almaName) {
    if (!this.isInvoked) {
      this.terminal.println('ERRO: As almas não foram invocadas.', 'error');
      this.terminal.println('Execute: run OPERATION_13ALMAS', 'hint');
      return;
    }

    const alma = almaName.toUpperCase();

    if (!this.theThirteenAlmas.includes(alma)) {
      this.terminal.println(`Alma "${almaName}" não encontrada no registro.`, 'error');
      this.terminal.println('Use: summon all (para invocar todas)', 'hint');
      return;
    }

    this.terminal.println('', 'output');
    this.terminal.println('█████████████████████████████████████████████████', 'system');
    this.terminal.println(`  INVOCANDO ALMA: ${alma}`, 'system');
    this.terminal.println('█████████████████████████████████████████████████', 'system');

    await this.channelAlma(alma);
    this.soulsFound.add(alma);
  }

  async summonAll() {
    if (!this.isInvoked) {
      this.terminal.println('ERRO: As almas não foram invocadas.', 'error');
      return;
    }

    this.terminal.println('', 'output');
    this.terminal.println('█████████████████████████████████████████████████', 'system');
    this.terminal.println('  INVOCANDO TODAS AS 13 ALMAS', 'system');
    this.terminal.println('█████████████████████████████████████████████████', 'system');

    for (const alma of this.theThirteenAlmas) {
      await this.channelAlma(alma);
      this.soulsFound.add(alma);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.terminal.println('', 'output');
    this.terminal.println('✓ TODAS AS 13 ALMAS FORAM INVOCADAS', 'success');
    this.terminal.println(`  Progresso: ${this.soulsFound.size}/13 almas desenterradas`, 'output');
  }

  async channelAlma(almaName) {
    const alma = almaName.toUpperCase();
    const dados = this.getDadosAlma(alma);

    if (!dados) {
      this.terminal.println(`Nenhum registro encontrado para: ${alma}`, 'error');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    this.terminal.println('  [Conectando com a alma...]', 'system');

    this.terminal.println(`┌─ ALMA #${this.theThirteenAlmas.indexOf(alma) + 1}: ${alma} ────────────┐`, 'success');
    this.terminal.println(`│ Status: ${dados.status}`, 'output');
    this.terminal.println(`│ Tipo: ${dados.tipo}`, 'output');

    if (dados.descricao) this.terminal.println(`│ Descrição: ${dados.descricao}`, 'hint');
    if (dados.valor) this.terminal.println(`│ Investimento: ${dados.valor}`, 'success');
    if (dados.ano) this.terminal.println(`│ Ano: ${dados.ano}`, 'output');
    if (dados.localizacao) this.terminal.println(`│ Localização: ${dados.localizacao}`, 'output');

    if (dados.narrative) {
      this.terminal.println(`│`, 'output');
      this.terminal.println(`│ [Sussurro da Alma]`, 'warning');
      this.terminal.println(`│ "${dados.narrative}"`, 'hint');
    }

    this.terminal.println(`└──────────────────────────────────────────────────┘`, 'success');
  }

  getDadosAlma(alma) {
    const database = {
      'TIBIRIÇÁ': {
        status: 'ENTUBADO',
        tipo: 'Rio Canalizado',
        descricao: 'Afluente do Rio Tietê, canalizado sob Av. 9 de Julho',
        valor: 'R$ 4.230.000,00',
        ano: 2001,
        localizacao: 'Centro-Norte SP',
        narrative: 'Meu leito era livre. Agora sou concreto. Meu murmúrio virou silêncio de máquina.'
      },
      'SARACURA': {
        status: 'DESAPARECIDA',
        tipo: 'Rio Subterrâneo',
        descricao: 'Completamente entubada no Centro da cidade',
        valor: 'R$ 8.900.000,00',
        ano: 1992,
        localizacao: 'Sé - Centro',
        narrative: 'Eles me enterraram viva. Ninguém mais ouve meu nome. Apenas sussurro nas canaletas.'
      },
      'TAMANDUATEÍ': {
        status: 'RETIFICADO',
        tipo: 'Rio Parcialmente Canalizado',
        descricao: 'Rio histórico com múltiplas intervenções urbanas',
        valor: 'R$ 15.700.000,00',
        ano: 1945,
        localizacao: 'Zona Leste',
        narrative: 'Minha forma natural foi apagada pela régua do progresso. Sou uma cicatriz urbana.'
      },
      'TIETÊ': {
        status: 'PARCIALMENTE RETIFICADO',
        tipo: 'Rio Principal',
        descricao: 'Principal rio de SP, sofreu retificação de 60% do seu curso',
        valor: 'R$ 250.000.000+',
        ano: '1890-2010',
        localizacao: 'Atravessa toda SP',
        narrative: 'Transformaram-me em arma. Em contenção. Perdi minha alma.'
      },
      'PINHEIROS': {
        status: 'CANALIZADO',
        tipo: 'Rio Artificial',
        descricao: 'Rio transformado em canal de controle de enchentes',
        valor: 'R$ 32.000.000,00',
        ano: 1960,
        localizacao: 'Zona Oeste',
        narrative: 'Nunca fui verdadeiro. Fui criado para servir. Para conter. Para obedecer.'
      },
      'CABUÇU': {
        status: 'ENTUBADO',
        tipo: 'Rio Menor',
        descricao: 'Pequeno rio completamente desaparecido da paisagem',
        valor: 'R$ 2.500.000,00',
        ano: 1985,
        localizacao: 'Zona Leste',
        narrative: 'Sou o esquecido. Ninguém sabe que existo. Ninguém sabe que fui apagada.'
      },
      'ARICANDUVA': {
        status: 'FRAGMENTADO',
        tipo: 'Rio Fragmentado',
        descricao: 'Rio dividido por urbanização, existência intermitente',
        valor: 'R$ 5.600.000,00',
        ano: 1998,
        localizacao: 'Zona Leste',
        narrative: 'Fui cortada. Espalhada. Meu corpo está em vários lugares.'
      },
      'MOOCA': {
        status: 'CONTROLADA',
        tipo: 'Rio com Barragem',
        descricao: 'Rio controlado por sistema de represamento',
        valor: 'R$ 8.200.000,00',
        ano: 1950,
        localizacao: 'Zona Leste',
        narrative: 'Construíram uma prisão em meu leito. Sou prisioneira de concreto.'
      },
      'GUARAPIRANGA': {
        status: 'REPRESADO',
        tipo: 'Represa',
        descricao: 'Reservatório de água criado por represamento',
        valor: 'R$ 120.000.000,00',
        ano: 1906,
        localizacao: 'Zona Sul',
        narrative: 'Fui transformada em propriedade. Perdi minha natureza.'
      },
      'BILLINGS': {
        status: 'REPRESADO',
        tipo: 'Grande Represa',
        descricao: 'Um dos maiores reservatórios de água',
        valor: 'R$ 180.000.000,00',
        ano: 1925,
        localizacao: 'Zona Sul/Sudeste',
        narrative: 'Sou a maior cadeia. Eles fizeram uma vítima de mim.'
      },
      'MATO GROSSO': {
        status: 'INCORPORADO',
        tipo: 'Rio Absolvido',
        descricao: 'Rio que foi incorporado a outro, perdendo identidade',
        valor: 'R$ 1.200.000,00',
        ano: 1951,
        localizacao: 'Centro',
        narrative: 'Meu nome foi apagado. Agora sou só parte de outro.'
      },
      'JOCA': {
        status: 'ENGOLIDO',
        tipo: 'Compositor/Rio',
        descricao: 'Compositor que desapareceu simbolicamente em 1951',
        valor: 'Incalculável',
        ano: 1951,
        localizacao: 'Rua Aurora',
        narrative: 'Eles disseram que saí da cidade. Mentira. Minha voz permanece.'
      },
      'O_GUARDIÃO': {
        status: 'VIGILANTE',
        tipo: 'Entidade',
        descricao: 'O Guardião da Tampa - Permanece enquanto tudo cai',
        valor: 'Inestimável',
        ano: '∞',
        localizacao: 'Centro Geométrico - SP',
        narrative: 'Eu permaneço. Imóvel. Invisível. Esperando o dia do retorno.'
      }
    };
    return database[alma] || null;
  }

  getStatus() {
    return {
      invoked: this.isInvoked,
      progress: `${this.soulsFound.size}/13`,
      soulsRemaining: this.theThirteenAlmas.filter(a => !this.soulsFound.has(a))
    };
  }
}

window.Operation13Almas = Operation13Almas;

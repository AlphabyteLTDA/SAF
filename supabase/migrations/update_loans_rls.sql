-- Fix Loans table RLS policies to allow updates and deletes

-- Permite que usuários atualizem seus próprios empréstimos (ex: para devolver ou cancelar reserva)
CREATE POLICY "Users can update their own loans" ON loans
FOR UPDATE
USING (auth.uid() = user_id);

-- Permite que administradores modifiquem qualquer empréstimo
CREATE POLICY "Admins can update any loan" ON loans
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permite que usuários excluam seus próprios empréstimos (se necessário)
CREATE POLICY "Users can delete their own loans" ON loans
FOR DELETE
USING (auth.uid() = user_id);

-- Permite que administradores excluam qualquer empréstimo
CREATE POLICY "Admins can delete any loan" ON loans
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
